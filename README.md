# Jazz Session Planner

Jazz セッションの参加者、希望曲、キー情報を登録し、曲ごとの sessionSet を自動生成する Next.js + Prisma + PostgreSQL アプリです。

このリポジトリには以下が含まれます。

- 参加者、曲、希望曲を管理する REST API
- PostgreSQL + Prisma の永続化層
- sessionSet を生成する割り当てロジック
- 生成結果と未生成理由を確認できる管理 UI
- ダミーデータを一括投入する seed スクリプト

---

## 要件

### 参加者と希望曲

- 参加者は楽器タグを 1 つ持つ
	- drum
	- bass
	- piano
	- front
	- vocal
- 参加者は希望曲を round 1 と round 2 で登録する
- non-vocal の希望曲上限
	- round 1: 2 曲
	- round 2: 2 曲
	- 合計: 4 曲
- vocal の希望曲上限
	- round 1: 2 曲
	- round 2: 1 曲
	- 合計: 3 曲
- vocal は希望曲登録時に key が必須
- round 1 で登録された曲のユニークリストを sessionSet 候補曲とする
- round 2 は既存曲からのみ選択できる

### sessionSet 生成ルール

- 各曲について drum, bass, piano は必須
- front は最大 2 名
- vocal が参加する場合、front は 1 名まで
- vocal は自分が希望した曲にのみ参加する
- round 1 希望者を優先し、足りない場合だけ round 2 希望者を使う
- 参加曲数が少ない人を優先して、できるだけ偏りを減らす

### 強制参加ロジック

- 通常ルールで生成できなかった曲のうち、必須パートについて「希望者がいない」曲を対象にする
- 他の希望者数が多い曲から順に再評価する
- 不足している drum / bass / piano は、参加曲数が最少の候補者群からランダムに 1 名選び、強制参加させる
- この追加生成ロジックを sessionSetForce として扱う
- 強制追加できた曲は通常の sessionSet と同じ一覧に保存し、どの楽器が強制参加だったかは生成結果で確認できる

---

## 基本設計

### システム構成

- フロントエンド: Next.js App Router
- バックエンド: Next.js Route Handler
- DB: PostgreSQL
- ORM: Prisma
- ロジック層: session-planner 配下の純粋な TypeScript 関数

### レイヤ構成

- UI
	- app/page.tsx
- API
	- app/api/participants/route.ts
	- app/api/songs/route.ts
	- app/api/requests/route.ts
	- app/api/session-sets/route.ts
	- app/api/session-sets/generate/route.ts
- ロジック
	- session-planner/src/domain.ts
	- session-planner/src/generateSessionSets.ts
- DB
	- prisma/schema.prisma
	- src/lib/prisma.ts

### データの流れ

1. UI または API から参加者、曲、希望曲を登録する
2. POST /api/session-sets/generate を呼ぶ
3. API は DB から参加者と希望曲を取得する
4. generateSessionSets が通常生成と sessionSetForce をまとめて実行する
5. 既存の SessionSet / SessionSetMember を削除して再保存する
6. API は生成結果、強制追加結果、未生成理由を返す

---

## 詳細設計

### ドメインモデル

主要な型定義は session-planner/src/domain.ts にあります。

- Participant
	- id
	- name
	- instrument
	- requestedSongs
- RequestedSong
	- title
	- round
	- key
- SessionSet
	- songTitle
	- drum
	- bass
	- piano
	- front
	- key
- SkippedSong
	- songTitle
	- reasons
- ForcedSessionSet
	- songTitle
	- forcedInstruments
	- requesterCount

### DB 設計

Prisma スキーマは prisma/schema.prisma にあります。

- Participant
	- 参加者本体
- Song
	- 曲マスタ
- ParticipantSongRequest
	- 参加者ごとの希望曲
	- participantId + songId はユニーク
- SessionSet
	- 曲ごとの割り当て結果本体
	- drumId / bassId / pianoId を保持
- SessionSetMember
	- front と vocal のメンバーを保持
	- role は front または vocal

### sessionSet 生成ロジック

session-planner/src/generateSessionSets.ts で生成します。

通常生成の流れ:

1. round 1 の曲名から候補曲を抽出する
2. 曲ごとに drum / bass / piano を優先度付きで割り当てる
3. 3 パートが揃わない曲は通常生成から除外する
4. vocal を希望者から割り当てる
5. vocal の有無に応じて front を 0 から 2 名割り当てる
6. 参加曲数カウンタを更新する

未生成理由の設計:

- Drum の希望者がいません
- Bass の希望者がいません
- Piano の希望者がいません
- Drum の候補者が割り当て上限に達しています
- Bass の候補者が割り当て上限に達しています
- Piano の候補者が割り当て上限に達しています

sessionSetForce の流れ:

1. 通常生成で落ちた曲を集める
2. 理由が「希望者がいません」のみで構成される曲だけを対象にする
3. 他の希望者数が多い順に処理する
4. 不足パートごとに、参加曲数が最少の候補者群からランダム選出する
5. 補完後に drum / bass / piano が揃えば追加の sessionSet として採用する
6. forcedInstruments に強制参加した楽器を記録する

### API 設計

参加者 API:

- GET /api/participants
	- 参加者一覧と希望曲一覧を返す
- POST /api/participants
	- 参加者を追加する

曲 API:

- GET /api/songs
	- 曲一覧を返す
- POST /api/songs
	- 曲を追加する

希望曲 API:

- POST /api/requests
	- 希望曲を追加する
	- vocal は key 必須
	- round ごとの上限と合計上限をチェックする

sessionSet API:

- GET /api/session-sets
	- 保存済み sessionSet を返す
- POST /api/session-sets/generate
	- sessionSet を再生成する
	- 返却値に以下を含む
		- sessionSets
		- forcedSessionSets
		- skippedSongs

### API リクエスト例 / レスポンス例

参加者追加:

```bash
curl -sS -X POST http://localhost:3000/api/participants \
	-H "Content-Type: application/json" \
	-d '{"name":"佐藤 匠","instrument":"drum"}'
```

レスポンス例:

```json
{
	"participant": {
		"id": "participant-id",
		"name": "佐藤 匠",
		"instrument": "drum"
	}
}
```

希望曲追加:

```bash
curl -sS -X POST http://localhost:3000/api/requests \
	-H "Content-Type: application/json" \
	-d '{"participantId":"participant-id","songTitle":"Autumn Leaves","round":1}'
```

vocal の希望曲追加例:

```bash
curl -sS -X POST http://localhost:3000/api/requests \
	-H "Content-Type: application/json" \
	-d '{"participantId":"vocal-participant-id","songTitle":"Misty","round":1,"keyName":"F"}'
```

レスポンス例:

```json
{
	"request": {
		"id": "request-id",
		"participantId": "participant-id",
		"songId": "song-id",
		"keyName": null,
		"round": 1
	}
}
```

sessionSet 生成:

```bash
curl -sS -X POST http://localhost:3000/api/session-sets/generate
```

レスポンス例:

```json
{
	"sessionSets": [
		{
			"id": "session-set-id",
			"songTitle": "Autumn Leaves",
			"key": null,
			"drum": { "id": "drum-id", "name": "佐藤 匠" },
			"bass": { "id": "bass-id", "name": "新井 大地" },
			"piano": { "id": "piano-id", "name": "三浦 隼人" },
			"front": [
				{ "id": "front-id-1", "name": "木村 葵" },
				{ "id": "front-id-2", "name": "中野 星那" }
			],
			"vocal": []
		}
	],
	"forcedSessionSets": [
		{
			"songTitle": "Misty",
			"forcedInstruments": ["bass"],
			"requesterCount": 6
		}
	],
	"skippedSongs": [
		{
			"songTitle": "Some Song",
			"reasons": ["Piano の候補者が割り当て上限に達しています"]
		}
	]
}
```

### API エラーレスポンス例

参加者追加の不正入力:

```json
{
	"error": "Invalid body"
}
```

曲追加の重複エラー:

```json
{
	"error": "Failed to create song (maybe duplicate?)"
}
```

希望曲追加で participantId が存在しない場合:

```json
{
	"error": "Participant not found"
}
```

vocal で keyName を指定しない場合:

```json
{
	"error": "keyName is required for vocal"
}
```

同じ曲を二重登録した場合:

```json
{
	"error": "Request for this song already exists"
}
```

round 2 で未登録曲を指定した場合:

```json
{
	"error": "Song must be chosen from existing titles for round=2"
}
```

### UI 設計

app/page.tsx で以下を提供します。

- 参加者登録
- 曲マスタ登録
- 希望曲登録
- sessionSet 生成
- 参加者ごとの希望曲表示
	- Round 1
	- Round 2
- sessionSet 一覧表示
- 強制参加で追加生成された曲の表示
- 生成されなかった曲と理由の表示

---

## 使い方

### セットアップ

1. 依存関係をインストール

```bash
npm install
```

2. 環境変数を作成

```bash
cp .env.example .env
```

例:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=jazz_session_planner
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jazz_session_planner?schema=public"
```

3. PostgreSQL を起動

```bash
docker compose up -d
```

4. Prisma マイグレーションを適用

```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. 開発サーバを起動

```bash
npm run dev
```

6. 必要なら Prisma Studio を起動

```bash
npm run prisma:studio
```

### ダミーデータ投入

一括投入:

```bash
npm run seed:demo
```

これは以下を順番に実行します。

- seed:reset
- seed:participants
- seed:requests

個別実行:

```bash
npm run seed:reset
npm run seed:participants
npm run seed:requests
```

現在のダミーデータ内容:

- 参加者 30 人
- vocal 3 人
- 曲マスタ 20 曲
- 希望曲データ 117 件

### sessionSet 生成

UI から生成:

- 画面の sessionSet を自動生成 ボタンを押す

API から生成:

```bash
curl -sS -X POST http://localhost:3000/api/session-sets/generate
```

生成結果確認:

```bash
node -e "fetch('http://localhost:3000/api/session-sets').then(r=>r.json()).then(d=>console.log(JSON.stringify({count:d.sessionSets.length, sample:d.sessionSets.slice(0,3)}, null, 2)))"
```

生成レスポンス確認:

```bash
node -e 'fetch("http://localhost:3000/api/session-sets/generate",{method:"POST"}).then(r=>r.json()).then(d=>console.log(JSON.stringify({generated:d.sessionSets.length,forced:d.forcedSessionSets.length,skipped:d.skippedSongs.length},null,2)))'
```

### 生成結果の見方

- sessionSets
	- 実際に保存された sessionSet 一覧
- forcedSessionSets
	- 強制参加で追加生成できた曲
	- forcedInstruments で強制参加した必須パートを確認できる
- skippedSongs
	- 最終的に生成できなかった曲
	- reasons に不足理由が入る

---

## 主要ファイル

- app/page.tsx
- app/api/participants/route.ts
- app/api/songs/route.ts
- app/api/requests/route.ts
- app/api/session-sets/route.ts
- app/api/session-sets/generate/route.ts
- prisma/schema.prisma
- prisma/demo-data.mjs
- prisma/reset-demo-data.mjs
- prisma/seed-participants.mjs
- prisma/seed-requests.mjs
- session-planner/src/domain.ts
- session-planner/src/generateSessionSets.ts

---

## 補足

- sessionSet 生成は再実行のたびに既存データを入れ替えます
- sessionSetForce の強制参加は、参加曲数が最少の候補者群からランダム選出します
- そのため、同じ入力データでも再生成時に一部の担当者が変わる可能性があります

