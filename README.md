-- Active: 1782193642844@@127.0.0.1@5432
# Jazz Session Planner

Adlib-go KICK-OFF 向けの public site、member site、admin site をまとめた Next.js + Prisma + PostgreSQL アプリです。

このリポジトリには以下が含まれます。

- 公開トップ、コラム一覧、コラム詳細、about、お問い合わせページ
- メンバー用サインアップ / サインイン、管理者用サインイン、パスワード再設定 API
- メンバーサインアップ時の確認メール送信とメールアドレス認証
- メンバーサインアップ時の楽器、居住地域、性別、年代登録
- メンバーページでのプロフィール編集、パスワード変更、SessionEntry、レイティング
- 管理ダッシュボードでの SessionEvent、sessionSet、アーカイブ、お知らせ、コラム管理
- コラムの表示順、予約公開、管理画面プレビュー
- 管理ダッシュボードでのメンバー検索、role/status 更新、削除
- PostgreSQL + Prisma の永続化層
- sessionSet を生成する割り当てロジック
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
	- app/signin/page.tsx
	- app/signup/page.tsx
	- app/member/page.tsx
	- app/admin/page.tsx
	- app/admin/signin/page.tsx
	- app/columns/page.tsx
	- app/columns/[slug]/page.tsx
- API
	- app/api/auth/*
	- app/api/members/*
	- app/api/announcements/*
	- app/api/columns/*
	- app/api/session-events/*
	- app/api/session-sets/route.ts
	- app/api/session-sets/generate/route.ts
	- app/api/session-archives/*
- ロジック
	- session-planner/src/domain.ts
	- session-planner/src/generateSessionSets.ts
- フロントエンド共通コンポーネント
	- src/components/public/PublicHomePage.tsx
	- src/components/portal/PortalWorkspace.tsx
	- src/components/portal/hooks/useAuthPortal.ts
	- src/components/portal/hooks/useMemberPortal.ts
	- src/components/portal/hooks/useAdminPortal.ts
- DB
	- prisma/schema.prisma
	- src/lib/prisma.ts

### 認証と公開制御

- `/signin` と `/signup` はメンバー専用
- 管理者サインインは `/admin/signin`
- `/member` は有効な `MemberProfile` を持つユーザー、`/admin` は `role=admin` のユーザーに限定してサーバーサイドで保護
- `role=admin` かつ `MemberProfile` を持つユーザーは管理者とメンバーを兼務し、同じセッションで `/admin` と `/member` の両方を利用可能
- 兼務管理者が `/member` を利用するとき、お知らせなどは通常メンバーと同じ公開範囲で表示
- サインアップ時は表示名、メイン楽器、居住地域、性別、年代が必須
- `/signup` では確認メールを送信し、リンクを開くまでサインインできない
- vocal 以外はサブ楽器を任意登録できる
- サインイン時に未認証アカウントだった場合は確認メールを再送する
- コラムは `isPublished=true` かつ `publishedAt <= now` のときだけ public 側に表示
- public 側のコラム一覧は `displayOrder asc`、同順位内は `publishedAt desc` で表示

### 環境変数

- `DATABASE_URL`
- `APP_BASE_URL`
- `MAIL_FROM`
- `CONTACT_TO_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `CONTACT_RATE_LIMIT_MAX`（任意。既定値: 3回）
- `CONTACT_RATE_LIMIT_WINDOW_MS`（任意。既定値: 600000ミリ秒）

`CONTACT_TO_EMAIL` は公開お問い合わせフォームの送信先です。お問い合わせ本文は 10〜2,000 文字に制限し、制御文字を除去したプレーンテキストとして送信します。Honeypot、同一オリジン確認、16KB のリクエスト上限、プロセス内の IP 単位レート制限を適用しています。

プロセス内レート制限は単一インスタンス向けの簡易対策です。複数インスタンスや Serverless の本番環境では、Vercel Firewall、Redis / KV などの共有ストア、必要に応じて CAPTCHA を併用してください。

### メンバー重複登録の扱い

- サインアップ API はメールアドレス重複に加え、表示名、メイン楽器、居住地域、性別、年代が一致する既存プロフィールを 409 で拒否します
- 既存データの重複候補を洗うには `npm run audit:member-duplicates` を実行します
- この監査スクリプトは JSON を標準出力し、候補が 1 件でも見つかると終了コード 1 を返します
- `exactProfileDuplicates` は今回の登録ガードと同じ条件、`displayNameDuplicates` は同名アカウントのレビュー用です

---

## CI / CD

このリポジトリでは GitHub Actions で CI を実行し、main ブランチへの push 後に Vercel へ本番デプロイする構成を想定しています。

### CI の内容

Workflow は [.github/workflows/ci.yml](.github/workflows/ci.yml) にあります。

- pull request と main への push で実行
- PostgreSQL 16 の service container を起動
- `npm ci`
- `npx prisma generate`
- `npx prisma migrate deploy`
- `npm run build`

CI ではローカル開発用と同じ値で一時的な PostgreSQL を起動するため、追加の GitHub Secrets は不要です。

`npm run lint` は ESLint 9 + Next.js 16 向けに実行できるよう整えてありますが、既存コードベースに lint 指摘が残っているため、現時点では blocking CI には含めていません。lint を品質ゲートに昇格させる場合は、既存警告とエラーを解消してから workflow に戻してください。

### Vercel デプロイの内容

同じ workflow 内で、main ブランチへの push かつ CI 成功後に Vercel へ production deploy を実行します。

このリポジトリは Prisma Client を使うため、Vercel の依存キャッシュ環境でも確実に Prisma Client を再生成できるように `postinstall` と `build` の両方で `prisma generate` を実行する構成にしています。

GitHub Repository Secrets に以下を設定してください。

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Vercel 側で設定する環境変数

Vercel プロジェクトには少なくとも以下を設定してください。

- `DATABASE_URL`
- `APP_BASE_URL`
- `MAIL_FROM`
- `CONTACT_TO_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `CONTACT_RATE_LIMIT_MAX`（任意）
- `CONTACT_RATE_LIMIT_WINDOW_MS`（任意）

`APP_BASE_URL` は本番 URL に合わせて設定してください。例: `https://your-project.vercel.app`

### 本番 DB に migration を流す手順

このリポジトリの CI は検証用 PostgreSQL に対して `prisma migrate deploy` を実行しますが、本番 DB への migration 適用は別途実施してください。

ローカルの `.env` や `.env.local` を書き換えずに実行するため、コマンド実行時に本番 `DATABASE_URL` をその場で渡す運用を推奨します。

1. まず本番接続先が正しいか確認する

```bash
DATABASE_URL='postgresql://...production...' npm run prisma:migrate:status
```

2. 問題なければ本番 DB に migration を適用する

```bash
DATABASE_URL='postgresql://...production...' npm run prisma:migrate:deploy
```

3. 適用後にもう一度状態を確認する

```bash
DATABASE_URL='postgresql://...production...' npm run prisma:migrate:status
```

補足:

- `DATABASE_URL` には Vercel Production 環境変数に設定したものと同じ値を使ってください
- `localhost:5432` のようなローカル DB 接続文字列を本番用として使わないでください
- migration 適用後に Vercel 側で再デプロイすると、本番 runtime とスキーマ差分を避けられます
- Prisma のエラーが出る場合は、まず `P1001` は接続不能、`P2021` はテーブル未作成を疑ってください

### 初回セットアップ手順

1. GitHub にこのリポジトリを push する
2. Vercel で対象プロジェクトを作成する
3. `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID` を GitHub Secrets に登録する
4. Vercel 側に production 用の環境変数を登録する
5. main ブランチへ push して CI と production deploy を確認する


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
- Column
	- 公開コラム本体
	- `displayOrder` で表示順、`publishedAt` で予約公開日時を管理
- UserAccount / MemberProfile
	- ログイン情報とメンバープロフィール
	- 楽器、居住地域、性別、年代、ニックネーム、自己紹介を保持
	- member 自身がプロフィール編集とパスワード変更可能
	- 管理画面から role/status とプロフィール編集、削除を実施

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

admin dashboard で以下を提供します。

- SessionEvent と sessionSet の生成 / 公開
- SessionEvent ステータス遷移に応じた自動メール送信
- アーカイブ preview / 作成 / 削除
- お知らせ作成
- コラムの作成 / 更新 / 削除
- コラムの表示順指定、予約公開日時指定、ライブプレビュー
- メンバー検索
- メンバーのプロフィール、role / status 更新
- メンバー削除
- 公開イベントへのコメント確認

---

## 使い方

### デモログイン情報

- 管理者: `/admin/signin`
- メンバー例: `/signin`

サインアップ / member プロフィールで扱う主な項目:

- 表示名
- メイン楽器
- サブ楽器（vocal 以外で任意）
- 居住地域（都道府県）
- 性別
- 年代（20代から80代）
- ニックネーム
- 自己紹介
- パスワード変更

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
APP_BASE_URL="http://localhost:3000"
MAIL_FROM="no-reply@adlib-go.local"
SMTP_HOST=""
SMTP_PORT=""
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
MAIL_TEST_REDIRECT_TO=""
MAIL_SEND_INTERVAL_MS="1000"
```

`/api/auth/forgot-password` は nodemailer を使います。`SMTP_HOST` などが未設定の開発環境では `jsonTransport` で動作し、レスポンスに `resetToken` を返します。SMTP を設定すると実メール送信に切り替わります。

全メンバー向け通知を 1 つのメールアドレスでテストしたい場合は、`MAIL_TEST_REDIRECT_TO` に受信用アドレスを設定してください。すると実際の送信先はすべてその 1 アドレスに置き換わり、件名・本文・mailLog には元の宛先も残ります。

```env
MAIL_TEST_REDIRECT_TO="your-address@example.com"
```

この設定時は bulk 通知でもメンバー人数分のメールが同じ inbox に届くため、「全員に送ったときの通数」「件名」「本文差し込み」を本番に近い形で確認できます。通常運用前には必ず空文字へ戻してください。

SMTP サーバの同時接続数やレート制限を避けるため、送信は共通キューで直列化し、既定では 1 通ごとに 1000ms 待機します。待機時間は `MAIL_SEND_INTERVAL_MS` で調整できます。

```env
MAIL_SEND_INTERVAL_MS="1000"
```

3. PostgreSQL を起動

```bash
docker compose up -d
```

4. Prisma マイグレーションを適用

```bash
npx prisma migrate dev
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

7. デモデータをまとめて再投入する場合

```bash
npm run seed:demo
```

補足:

- `npm run seed:columns` は upsert なので再実行しても既存 slug を更新できます
- demo column には予約公開サンプルが 1 件含まれます
- `npm run seed:auth` は demo admin にも `MemberProfile` と `Participant` を作成し、管理者・メンバー兼務状態にします
- `npm run seed:auth` は demo member のメールを `@adlib-go.local` に正規化します。旧 `@adolib-go.local` や同一プロフィール重複が残っている場合は停止するため、先に重複解消を行ってください

既存のプロフィール未登録adminを兼務可能にする場合は、まずdry-runで内容を確認します。

```bash
npm run setup:admin-member-profile -- \
  --email=admin@example.com \
  --display-name="管理者 表示名" \
  --main-instrument=front \
  --sub-instrument="ギター" \
  --gender="回答しない" \
  --age-range="40代" \
  --area="東京都"
```

問題がなければ、同じコマンドの末尾に `--apply` を追加します。この処理は `MemberProfile` と、sessionSet編成に利用する同一人物の `Participant` をトランザクション内で作成します。すでにプロフィールがあるadminは変更しません。

### Phase 1 実装済み機能

- Cookie セッションによるサインイン / サインアップ / サインアウト
- nodemailer ベースのパスワード再設定メール送信基盤
- メンバーのプロフィール自己編集とパスワード変更
- 管理者向け SessionEvent 作成 / 更新 / ステータス切替 / 削除 API / 画面
- メンバー向け SessionEntry 登録 API / 画面
- Round 1 / Round 2 の募集期間に応じた入力制御
- SessionEntry ベースの sessionSet 生成
- sessionSet 公開確定フロー
- メンバーによる星 1-5 の sessionSet 評価
- 公開イベントへのコメント投稿と管理画面確認
- 管理者による評価集計確認
- SessionArchive preview / 作成 / 削除
- 管理者サインイン導線の分離
- コラムの表示順 / 予約公開 / 管理画面プレビュー
- メンバー検索、プロフィール編集、削除

### SessionEvent ステータス運用

SessionEvent には 2 種類のイベント形式があります。

- `song_request`: リクエスト曲を募集し、sessionSet の生成・公開・レイティングを行う従来形式
- `attendance_only`: リクエスト曲を募集せず、参加可否と懇親会参加可否だけを受け付ける形式

現在の SessionEvent ステータス:

- `draft`: 管理者のイベント準備期間。メンバー画面には表示しません
- `announced`: 開催予定イベントとしてメンバー画面に表示します。切替時にアクティブなメンバー全員へ告知メールを送信します
- `recruiting_round1`: 参加可否と Round 1 希望曲を受け付けます。切替時にアクティブなメンバー全員へ募集開始メールを送信します
- `recruiting_round2`: Round 1 の候補曲から Round 2 希望曲を受け付けます。切替時に参加表明済みメンバーへ募集開始メールを送信します
- `generating`: 管理画面で sessionSet を作成、編集、保存する期間です
- `published`: sessionSet をメンバー画面で公開します。公開中はイベントコメントを投稿できます
- `rating`: 各曲に対するレイティングとコメントを受け付けます
- `closed`: レイティング入力を停止し、メンバー画面では終了イベント一覧から結果だけ参照できます

補足:

- `attendance_only` で選択できるステータスは `draft` / `announced` / `published` / `closed` のみです
- `attendance_only` では `published` を参加受付中として扱い、SessionEntryRequest、sessionSet、レイティングを作成しません
- `attendance_only` を `published` に切り替えると、アクティブなメンバー全員へ参加受付開始メールを送信します
- `attendance_only` の終了時アーカイブは、開催日・場所・参加者リストだけを保存します
- `published` への切替は `POST /api/session-events/:id/publish` で行い、公開対象の参加メンバーへメール送信します
- `published` 中のみ `POST /api/session-events/:id/comments` でイベントコメントを受け付け、投稿時に管理者へ通知します
- `rating` 中のみ `POST /api/session-sets/:id/ratings` を受け付けます
- イベント削除時は参加履歴・希望曲・sessionSet・評価・コメント・下書きを削除し、作成済みアーカイブだけを独立したスナップショットとして残します

### Phase 1 API 確認例

SessionEvent 一覧:

```bash
curl -sS http://localhost:3000/api/session-events
```

SessionEvent 作成:

```bash
curl -sS -X POST http://localhost:3000/api/session-events \
	-H "Content-Type: application/json" \
	-b cookies.txt -c cookies.txt \
	-d '{"title":"2026年7月セッション","venue":"代官山 Session Lab","eventDate":"2026-07-10"}'
```

リクエスト曲なしイベントの作成:

```bash
curl -sS -X POST http://localhost:3000/api/session-events \
	-H "Content-Type: application/json" \
	-b cookies.txt -c cookies.txt \
	-d '{"eventType":"attendance_only","title":"2026年8月 リクエスト曲なしセッション","venue":"代官山 Session Lab","eventDate":"2026-08-10","startTime":"2026-08-10T13:00:00+09:00","endTime":"2026-08-10T17:00:00+09:00","hasAfterParty":true,"participantLimit":30}'
```

SessionEvent 更新と募集状態変更:

```bash
curl -sS -X PATCH http://localhost:3000/api/session-events/event-id \
	-H "Content-Type: application/json" \
	-b cookies.txt -c cookies.txt \
	-d '{"status":"recruiting_round1","round1StartAt":"2026-04-10T10:00:00.000Z","round1EndAt":"2026-04-17T14:59:59.000Z"}'
```

SessionEvent を告知ステータスへ変更:

```bash
curl -sS -X PATCH http://localhost:3000/api/session-events/event-id \
	-H "Content-Type: application/json" \
	-b cookies.txt -c cookies.txt \
	-d '{"status":"announced"}'
```

SessionEvent 削除:

```bash
curl -sS -X DELETE http://localhost:3000/api/session-events/event-id \
	-b cookies.txt -c cookies.txt
```

SessionEntry 登録:

```bash
curl -sS -X POST http://localhost:3000/api/session-entries \
	-H "Content-Type: application/json" \
	-b cookies.txt -c cookies.txt \
	-d '{"sessionEventId":"event-id","attendanceStatus":"attending","requests":[{"songTitle":"Autumn Leaves","round":1,"priority":1}]}'
```

リクエスト曲なしイベントへの参加回答:

```bash
curl -sS -X POST http://localhost:3000/api/session-entries \
	-H "Content-Type: application/json" \
	-b cookies.txt -c cookies.txt \
	-d '{"sessionEventId":"attendance-only-event-id","attendanceStatus":"attending","afterPartyAttendanceStatus":"absent","requests":[]}'
```

補足:

- `recruiting_round1` の間は Round 1 のみ登録できます
- `recruiting_round2` の間は Round 2 のみ登録できます
- `song_request` では `announced` / `generating` / `published` / `rating` / `closed` の間、SessionEntry を保存できません
- `attendance_only` では `published` の間だけ参加回答を保存でき、`requests` は空配列でなければなりません
- 募集期間外は SessionEntry を保存できません

sessionSet 生成:

```bash
curl -sS -X POST http://localhost:3000/api/session-sets/generate \
	-H "Content-Type: application/json" \
	-b cookies.txt -c cookies.txt \
	-d '{"sessionEventId":"event-id"}'
```

補足:

- sessionSet 生成元は `ParticipantSongRequest` ではなく `SessionEntryRequest` です
- 生成対象イベントが募集受付中の場合は生成できません

sessionSet 公開確定:

```bash
curl -sS -X POST http://localhost:3000/api/session-events/event-id/publish \
	-b cookies.txt -c cookies.txt
```

補足:

- sessionSet を `isPublished=true` にし、SessionEvent の status を `published` に更新します
- 参加表明済みメンバーへ公開通知メールを送信します

イベントコメント投稿:

```bash
curl -sS -X POST http://localhost:3000/api/session-events/event-id/comments \
	-H "Content-Type: application/json" \
	-b cookies.txt -c cookies.txt \
	-d '{"body":"sessionSet の公開ありがとうございます。当日の持ち物も確認したいです。"}'
```

rating 保存:

```bash
curl -sS -X POST http://localhost:3000/api/session-sets/set-id/ratings \
	-H "Content-Type: application/json" \
	-b cookies.txt -c cookies.txt \
	-d '{"rating":5,"comment":"とても良かったです"}'
```

補足:

- rating API は SessionEvent の status が `rating` のときだけ受け付けます
- `closed` では新規レイティング登録はできず、結果参照のみ行います

archive preview と作成:

```bash
curl -sS http://localhost:3000/api/session-events/event-id/archive-preview \
	-b cookies.txt -c cookies.txt

curl -sS -X POST http://localhost:3000/api/session-archives \
	-H "Content-Type: application/json" \
	-b cookies.txt -c cookies.txt \
	-d '{"sessionEventId":"event-id","title":"2026年5月セッション 初版アーカイブ","note":"当日確定版"}'
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
- seed:auth
- seed:columns
- seed:events
- seed:notices
- seed:ratings-archives

個別実行:

```bash
npm run seed:reset
npm run seed:participants
npm run seed:participants:members
npm run seed:requests
npm run seed:black-book-songs
npm run seed:auth
npm run seed:columns
npm run seed:events
npm run seed:notices
npm run seed:ratings-archives
```

補足:

- `npm run seed:participants` は prisma/demo-data.mjs の参加者を Participant に投入します
- `npm run seed:participants:members` は現在の MemberProfile の `displayName` と `mainInstrument` を Participant に投入します
- どちらのコマンドも既存 Participant を削除せず、不足分だけを追加します

黒本曲カタログを更新した場合:

1. [prisma/black-book-song-catalog.mjs](prisma/black-book-song-catalog.mjs) の対象リストへ曲名を追加します
2. リポジトリ直下で以下を実行します

```bash
npm run seed:black-book-songs
```

このコマンドは `.env` / `.env.local` の `DATABASE_URL` が指す DB の `Song` テーブルへ曲名を upsert します。
未登録の曲は新規作成し、既存の曲は対象に応じて `isJazzStandardBible1` または `isJazzStandardBible2` を `true` に更新します。
曲データの更新だけなので Prisma マイグレーションは不要です。

反映結果はコマンド終了時に表示される `uniqueSongCount` と `upsertedCount` で確認できます。
DB の内容を直接確認する場合は以下を実行します。

```bash
npm run prisma:studio
```

現在の DB 内容を seed スナップショットとして保存 / 復元:

```bash
npm run seed:snapshot:save
npm run seed:snapshot:restore -- --dry-run
npm run seed:snapshot:restore
```

補足:

- `npm run seed:snapshot:save` は現在の DB 内容を [prisma/current-db-seed.snapshot.json](prisma/current-db-seed.snapshot.json) に保存します
- `npm run seed:snapshot:save -- prisma/custom.snapshot.json` のように保存先を変更できます
- `npm run seed:snapshot:restore -- --dry-run` は復元せず、スナップショットの件数確認だけを行います
- `npm run seed:snapshot:restore` は一度テーブルをクリアしてからスナップショット内容を再投入します
- `npm run seed:snapshot:restore -- prisma/custom.snapshot.json` のように復元元ファイルを変更できます
- `authSessions` や `mailLogs` も含めて保存 / 復元するため、実運用データで使う場合は対象 DB を十分確認してください

重複監査と解消:

```bash
npm run audit:member-duplicates
npm run fix:member-duplicates
npm run fix:member-duplicates -- --apply
```

補足:

- `npm run fix:member-duplicates` は dry-run です。`--apply` を付けたときだけ DB を更新します
- `npm run fix:member-duplicates -- --apply` は exactProfileDuplicates を基準に、関連する SessionEntry、SessionSetRating、作成者参照を可能な範囲で保持しつつ重複 UserAccount を統合します
- demo の front メンバーは `アルトサックス`、`テナーサックス`、`トランペット`、`ギター`、`トロンボーン`、`フルート` のいずれかを固定ランダムで `subInstrument` に持ちます

現在のダミーデータ内容:

- 参加者 30 人
- vocal 3 人
- 曲マスタ 20 曲
- 希望曲データ 117 件
- 管理者アカウント 1 件
- メンバー用 UserAccount 30 件
- MemberProfile 30 件
- SessionEvent 1 件
- SessionEntry 30 件
- SessionSet 20 件
- SessionSetRating 100 件
- SessionArchive 1 件
- Column 3 件
- Announcement 2 件
- アーカイブ作成監査ログ 1 件

認証系デモデータ補足:

- デモアカウントの passwordHash は seed 時にハッシュ化済みです
- 管理 API の暫定確認には admin@adlib-go.local を使う想定です
- demo admin は `role=admin` と `MemberProfile` を併せ持ち、管理ダッシュボードとメンバーマイページの両方を確認できます

### 画面導線

- public
	- /
	- /columns
	- /columns/:slug
	- /about
- member
	- /signin
	- /signup
	- /member
- admin
	- /admin

補足:

- /member と /admin は server-side で認証確認します。/member は `MemberProfile`、/admin は `role=admin` を利用条件とします
- コラムは Prisma の Column モデルで管理され、admin 画面から作成、更新、削除、公開切替ができます

### sessionSet 生成

UI から生成:

- 画面の sessionSet を自動生成 ボタンを押す

API から生成:

```bash
curl -sS -X POST http://localhost:3000/api/session-sets/generate \
	-H "Content-Type: application/json" \
	-d '{"sessionEventId":"event-id"}'
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

### 拡張計画ドキュメント

- docs/要件定義書.md
- docs/基本設計書.md
- docs/詳細設計書.md
- docs/DBテーブル案.md
- docs/実装計画書.md
- docs/API仕様書.md
- docs/アーカイブ運用ルール.md
- docs/kickoff-schema.prisma

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

## 新規メンバー追加について

**新規メンバーは紹介制にする**

### 作業の流れ

1. 特定の紹介情報を得た時
2. 管理者が
3. ダッシュボードで
4. 新規メンバー登録案内メール送信する

### 管理者の作業

- **以下の項目を入力する**
	- 登録希望者のメールアドレス

- **「新規メンバー仮登録」ボタンを押す**

### システムの機能

- **管理者が「新規メンバー仮登録」ボタンで以下を実行**
	- /signup へアクセスするためのトークンを発行する
	- トークンの有効期間は発行から1ヶ月とする
	- 新規登録者へトークン付きの/signup URL を記載した「メンバー登録のご案内」メールを自動送信する

- /signup へのアクセスはトークンパラメータを必要とする

**上記、新規メンバー追加機能を実装済み**

要マイグレーション

		npx prisma migrate deploy

## レイティング
### 要件
- ログイン中のメンバーが
- 対象イベントの各演奏曲に
- 星を1~5をつける(無しでもよい)
- 任意にコメントを記述できる
- 「結果を送信」ボタンを設け、レイティングを終える
- 他のメンバーのレイティング結果と集計して保存
- 結果を逐一表示する(マイページとダッシュボード)
- イベントのステータスが「終了」になったらsessionSetと関連付けてアーカイブとして保存する

### ダッシュボード及びマイページでのレイティング結果表示について
@src/components/portal/AdminPortalSection.tsx (1806行目) のratingSummaries.map で構築している<li>ブロック内にマイページと同じような体裁で各曲の集計結果とコメントを表示して欲しい。
コメントが複数の場合はリスト表示とする。
レイティングしたメンバーについては考慮しない。
この表示を同じようにマイページにも表示する。

## アーカイブ
### 要件
- イベントのステータスが「終了」になったら
- レイティング結果と関連付けて
- アーカイブとして保存する
- アーカイブ名はイベント名と開催日を合わせる
- 各アーカイブはダッシュボードでリスト表示(プルダウンで内容を表示)
- アーカイブで保存する項目
	- アーカイブ名称
	- イベント開催日
	- 参加者
	- sessionSet
	- レイティング結果
