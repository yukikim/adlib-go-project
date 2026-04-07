## Jazz Session Planner 概要

複数名の参加者から JAZZ セッションで演奏したい曲を集め、

- 曲ごとの構成（drum / bass / piano / front / vocal）
- vocal のキー

を自動で割り当てるための Next.js + Node.js(TypeScript) プロジェクトです。

バックエンドロジック、DB スキーマ、REST API、および簡易管理 UI を一通り含んでいます。

---

## 技術スタック

- Node.js
- Next.js 14 (App Router)
- TypeScript
- Prisma
- PostgreSQL（デフォルト想定。`prisma/schema.prisma` の `provider` を変更すれば他でも可）

---

## ドメイン要件の要約

- 参加者は 20〜30 名程度を想定。
- 参加者ごとに一意な楽器タグが付与される。
	- `drum`, `bass`, `piano`, `front`, `vocal`
- 参加者は 1 回目の希望として 2 曲、2 回目として追加曲を出す。
	- non-vocal: 合計 4 曲（round=1 が 2 曲 + round=2 が 2 曲）
	- vocal: 合計 3 曲（round=1 が 2 曲 + round=2 が 1 曲）
	- vocal の希望曲には必ずキー（例: `C`, `F#` など）が付く。
- `round=1` で出された曲名のユニークリストが「セッション候補曲」となる。
- 2 回目の希望 (round=2) は、この候補曲リストの中から選ぶ。

### sessionSet オブジェクト

1 曲分の構成は次の形で表現します。

```ts
sessionSet = {
	songTitle: "曲名",
	drum: "drum の participant.id",
	bass: "bass の participant.id",
	piano: "piano の participant.id",
	front: ["front の participant.id", "front の participant.id", ...],
	key: "vocal が歌うキー (任意)",
};
```

制約・ルール:

- `front` は 1〜3 名。
- `front` に vocal を含めてもよい（UI / API 上では front と vocal を別フィールドでも返却）。
- vocal は「自分が希望した曲」にのみ参加し、最大 3 曲。
- non-vocal は 3〜4 曲程度に、できるだけ公平になるように割り当てる。
- 各曲について、1 回目(round=1) の希望者を優先して割り当て、足りない場合だけ 2 回目(round=2) の希望者から補完する。

---

## 実装された主なファイル

### ロジック / ドメイン

- セッションロジック:
	- [session-planner/src/domain.ts](session-planner/src/domain.ts)
	- [session-planner/src/generateSessionSets.ts](session-planner/src/generateSessionSets.ts)

`generateSessionSets(participants)` 関数が、参加者一覧から `SessionSet[]` を生成するメインのアルゴリズムです。

### Next.js & Prisma 設定

- Next.js / TypeScript 設定:
	- [package.json](package.json)
	- [tsconfig.json](tsconfig.json)
	- [next.config.mjs](next.config.mjs)
	- [app/layout.tsx](app/layout.tsx)
	- [app/page.tsx](app/page.tsx)
- Prisma:
	- [prisma/schema.prisma](prisma/schema.prisma)
	- DB クライアント: [src/lib/prisma.ts](src/lib/prisma.ts)

### REST API ルート

- 参加者 API
	- `GET /api/participants`
	- `POST /api/participants`
	- 実装: [app/api/participants/route.ts](app/api/participants/route.ts)

- 曲マスタ API
	- `GET /api/songs`
	- `POST /api/songs`
	- 実装: [app/api/songs/route.ts](app/api/songs/route.ts)

- 希望曲登録 API
	- `POST /api/requests`
	- 実装: [app/api/requests/route.ts](app/api/requests/route.ts)
	- 主なバリデーション:
		- vocal: 合計 3 曲まで / round=1 は 2 曲まで / round=2 は 1 曲まで
		- non-vocal: 合計 4 曲まで / round=1 は 2 曲まで / round=2 は 2 曲まで
		- 同じ participant が同じ曲を二重登録不可
		- round=1: 曲がなければ自動で `Song` を作成
		- round=2: 既存の曲（= round=1 で作られた候補曲）のみ選択可

- セッション自動割り当て API
	- 生成: `POST /api/session-sets/generate`
		- 実装: [app/api/session-sets/generate/route.ts](app/api/session-sets/generate/route.ts)
		- 参加者＋希望曲を DB から取得し、`generateSessionSets` で `sessionSet` を生成。
		- 既存の `SessionSet` / `SessionSetMember` を削除し、新たに保存します。
	- 一覧取得: `GET /api/session-sets`
		- 実装: [app/api/session-sets/route.ts](app/api/session-sets/route.ts)
		- 曲名 / Key / Drum / Bass / Piano / Front / Vocal をフラットな形で返します。

### 管理 UI

- [app/page.tsx](app/page.tsx)

ブラウザから次の操作ができます。

1. 参加者の登録
	 - 名前と楽器を入力して追加。
2. 曲マスタの登録（任意）
	 - 曲名を追加（round=1 希望時には自動作成されるため補助的）。
3. 希望曲の登録
	 - 参加者を選択し、round(1 or 2) と曲名、必要に応じて key を入力。
4. sessionSet の自動生成
	 - ボタン 1 つで `/api/session-sets/generate` を叩き、結果をテーブル表示。

---

## セットアップ手順

1. 依存関係インストール

```bash
npm install
```

2. DB 設定

- ルートの `.env.example` を `.env` にコピーして使います。

```bash
cp .env.example .env
```

`.env` の例:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=jazz_session_planner
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jazz_session_planner?schema=public"
```

3. PostgreSQL 起動

```bash
docker compose up -d
```

- PostgreSQL は `localhost:5432` で待ち受けます。
- データは Docker volume `postgres_data` に永続化されます。

停止する場合:

```bash
docker compose down
```

データも削除する場合:

```bash
docker compose down -v
```

4. Prisma マイグレーション & クライアント生成

```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. 開発サーバ起動

```bash
npm run dev
```

- ブラウザで `http://localhost:3000` にアクセスすると管理 UI が表示されます。

6. ダミーデータ投入（任意）

- 参加者 30 人、曲マスタ 20 曲、希望曲データをまとめて入れる場合:

```bash
npm run seed:demo
```

- これは既存の参加者・曲・希望曲・sessionSet を一度削除してから再投入します。
- 個別実行したい場合は次を使います。

```bash
npm run seed:reset
npm run seed:participants
npm run seed:requests
```

---

## 典型的な利用フロー

1. 参加者を UI から登録（または `POST /api/participants` を叩く）。
2. 各参加者が 1 回目の希望曲 (round=1) を 2 曲ずつ登録。
	 - 必要ならこのタイミングで曲マスタが自動的に増えます。
3. 2 回目の希望曲 (round=2) を追加で登録。
	 - 曲は既存タイトルからのみ選ぶ。
4. 「sessionSet を自動生成」ボタンを押すか、`POST /api/session-sets/generate` を叩く。
5. `GET /api/session-sets` あるいは UI のテーブルで、曲ごとの構成を確認。

### sessionSet 生成確認コマンド

開発サーバ起動後に、API から sessionSet を生成して結果件数を確認できます。

```bash
curl -sS -X POST http://localhost:3000/api/session-sets/generate
```

生成済みデータを件数つきで確認する例:

```bash
node -e "fetch('http://localhost:3000/api/session-sets').then(r=>r.json()).then(d=>console.log(JSON.stringify({count:d.sessionSets.length, sample:d.sessionSets.slice(0,3)}, null, 2)))"
```

- 生成前にダミーデータを入れ直したい場合は `npm run seed:demo` を実行してください。
- `sessionSet` が 0 件のときは、まだ生成していないか、参加者・希望曲データが不足しています。

---

## 今後の拡張アイデア

- 曲順（セットリスト順）の自動最適化（テンポやキー、雰囲気のバランス）
- 同じ参加者が連続しすぎないようにする制約追加
- 曲ごとの最大人数（front の人数制御など）の調整ロジック強化
- CSV / PDF 形式でのセットリスト出力
