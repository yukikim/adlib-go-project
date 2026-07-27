# Adlib-go KICK-OFF API仕様書

## 1. 文書概要

本書は、KICK-OFF 拡張で追加する主要 API の request / response を具体化したものです。

前提:

- メンバー系 API は、有効な `MemberProfile` を持つ認証済みユーザーが利用できる
- `role=admin` でも `MemberProfile` があればメンバー系 API を利用でき、管理者とメンバーを兼務できる
- 管理系 API は admin 権限を持つユーザーのみ利用できる
- レスポンスは JSON とする

## 2. 認証 API

### 2.1 POST /api/auth/signup

用途:

- メンバーアカウントとプロフィールを新規作成する

request:

```json
{
  "email": "member31@adlib-go.local",
  "password": "password123",
  "displayName": "新規 参加者",
  "mainInstrument": "front"
}
```

response 201:

```json
{
  "user": {
    "id": "user-id",
    "email": "member31@adlib-go.local",
    "role": "member",
    "memberProfile": {
      "displayName": "新規 参加者",
      "mainInstrument": "front"
    }
  }
}
```

### 2.2 POST /api/auth/signin

用途:

- サインインして httpOnly cookie セッションを発行する

request:

```json
{
  "email": "admin@adlib-go.local",
  "password": "demo-admin-password"
}
```

response 200:

```json
{
  "user": {
    "id": "user-id",
    "email": "admin@adlib-go.local",
    "role": "admin",
    "memberProfile": null
  }
}
```

### 2.3 POST /api/auth/signout

用途:

- 現在のセッションを削除し cookie を無効化する

response 200:

```json
{
  "ok": true
}
```

### 2.4 GET /api/auth/me

用途:

- 現在のサインイン状態を返す

response 200:

```json
{
  "user": {
    "id": "user-id",
    "email": "admin@adlib-go.local",
    "role": "admin",
    "status": "active",
    "memberProfile": null
  }
}
```

### 2.5 POST /api/auth/forgot-password

用途:

- パスワード再設定トークンを発行する

補足:

- nodemailer を使用する
- `SMTP_HOST` などが未設定の開発環境では `jsonTransport` を使い、レスポンスに `resetToken` を含める
- SMTP が設定されている環境では `APP_BASE_URL` を使って再設定 URL を組み立て、実メール送信する

### 2.6 POST /api/auth/reset-password

用途:

- 再設定トークンを使ってパスワードを更新する

request:

```json
{
  "token": "reset-token",
  "password": "new-password-123"
}
```

## 3. セッションイベント API

### 3.0 GET /api/session-events

用途:

- SessionEvent 一覧を返す

response 200:

```json
{
  "sessionEvents": [
    {
      "id": "event-id",
      "eventType": "song_request",
      "title": "2026年5月セッション",
      "venue": "渋谷 Jazz Spot",
      "eventDate": "2026-05-17T00:00:00.000Z",
      "status": "draft",
      "_count": {
        "sessionEntries": 24,
        "sessionSets": 12
      }
    }
  ]
}
```

### 3.1 POST /api/session-events

用途:

- 管理者が新しいセッション開催情報を作成する

権限:

- admin

request:

```json
{
  "eventType": "song_request",
  "title": "2026年5月セッション",
  "description": "春の通常セッション",
  "venue": "渋谷 Jazz Spot",
  "eventDate": "2026-05-17",
  "startTime": "2026-05-17T13:00:00+09:00",
  "endTime": "2026-05-17T18:00:00+09:00",
  "round1StartAt": "2026-04-20T00:00:00+09:00",
  "round1EndAt": "2026-04-27T23:59:59+09:00",
  "round2StartAt": "2026-04-29T00:00:00+09:00",
  "round2EndAt": "2026-05-03T23:59:59+09:00"
}
```

`eventType`:

- `song_request`: 希望曲を募集する従来形式。省略時の既定値
- `attendance_only`: 参加可否と懇親会参加可否だけを募集する形式

response 201:

```json
{
  "sessionEvent": {
    "id": "event-id",
    "eventType": "song_request",
    "title": "2026年5月セッション",
    "venue": "渋谷 Jazz Spot",
    "eventDate": "2026-05-17T00:00:00.000Z",
    "status": "draft"
  }
}
```

response 400:

```json
{
  "error": "Invalid body"
}
```

### 3.2 PATCH /api/session-events/:id

用途:

- 管理者が SessionEvent の基本情報や status を更新する

権限:

- admin

request 例:

```json
{
  "status": "recruiting_round1",
  "round1StartAt": "2026-04-10T10:00:00.000Z",
  "round1EndAt": "2026-04-17T14:59:59.000Z"
}
```

補足:

- `draft` → `recruiting_round1` → `recruiting_round2` → `generating` / `published` / `closed` の順で使う
- SessionEntry 受付可否は `status` と round ごとの期間で判定する
- `attendance_only` で指定できる status は `draft` / `announced` / `published` / `closed` のみ
- `attendance_only` の `published` は参加受付中を表し、sessionSet 公開 APIは使用しない

### 3.3 DELETE /api/session-events/:id

用途:

- 管理者が SessionEvent と通常の関連データを削除する

権限:

- admin

動作:

- SessionEntry、希望曲、sessionSet、評価、コメント、保存済み sessionSet 下書きを削除する
- 作成済み SessionArchive はイベントとの参照を切り離して保持する
- 削除後のイベントと通常の関連データは、メンバーページの「自分の履歴」を含む一覧に表示しない

response 200:

```json
{
  "deleted": true,
  "eventId": "event-id",
  "retainedArchiveCount": 1
}
```

response 404:

```json
{
  "error": "SessionEvent not found"
}
```

## 4. セッション参加 API

### 4.1 POST /api/session-entries

用途:

- メンバーが対象イベントへの参加可否と希望曲を登録する
- `attendance_only` では参加可否と懇親会参加可否だけを登録する

権限:

- MemberProfile保有ユーザー（member / admin）

補足:

- `recruiting_round1` の間は `round=1` のみ受付
- `recruiting_round2` の間は `round=2` のみ受付
- round ごとに既存リクエストだけ差し替えるため、Round 1 登録後に Round 2 を追加できる

request:

```json
{
  "sessionEventId": "event-id",
  "attendanceStatus": "attending",
  "requests": [
    {
      "songTitle": "Autumn Leaves",
      "round": 1,
      "priority": 1,
      "keyName": null
    },
    {
      "songTitle": "Blue Bossa",
      "round": 1,
      "priority": 2,
      "keyName": null
    }
  ]
}
```

response 201:

```json
{
  "entry": {
    "id": "entry-id",
    "sessionEventId": "event-id",
    "memberProfileId": "member-id",
    "attendanceStatus": "attending",
    "sessionEvent": {
      "id": "event-id",
      "title": "2026年5月セッション"
    },
    "requests": [
      {
        "id": "entry-request-id-1",
        "songTitleSnapshot": "Autumn Leaves",
        "round": 1,
        "priority": 1,
        "keyName": null
      }
    ]
  }
}
```

response 400 例:

```json
{
  "error": "round2 の募集期間外です"
}
```

### 4.2 GET /api/session-entries

用途:

- サインイン中メンバーの SessionEntry 一覧を返す

権限:

- MemberProfile保有ユーザー（member / admin）

query:

- `sessionEventId` は任意

response 200:

```json
{
  "entries": [
    {
      "id": "entry-id",
      "attendanceStatus": "attending",
      "sessionEvent": {
        "id": "event-id",
        "title": "2026年5月セッション",
        "venue": "渋谷 Jazz Spot",
        "eventDate": "2026-05-17T00:00:00.000Z"
      },
      "requests": [
        {
          "id": "entry-request-id-1",
          "songTitleSnapshot": "Autumn Leaves",
          "round": 1,
          "priority": 1,
          "keyName": null
        }
      ]
    }
  ]
}
```

## 8. お知らせ / コラム API

### 8.1 GET /api/columns

用途:

- 公開中コラム一覧を返す

query:

- `includeDrafts=1` を付けた場合、admin 権限では draft を含めて返す

response 200:

```json
{
  "columns": [
    {
      "id": "column-id",
      "slug": "kickoff-guide",
      "title": "KICK-OFF セッションの歩き方",
      "summary": "初参加メンバー向けに、当日までの流れと準備物を整理しました。",
      "body": "1段落目\n\n2段落目",
      "thumbnailLabel": "Guide",
      "authorName": "Adlib-go 運営",
      "isPublished": true,
      "publishedAt": "2026-04-09T00:00:00.000Z"
    }
  ]
}
```

### 8.2 POST /api/columns

用途:

- 管理者がコラムを新規作成する

権限:

- admin

request:

```json
{
  "title": "KICK-OFF セッションの歩き方",
  "slug": "kickoff-guide",
  "summary": "初参加メンバー向けに、当日までの流れと準備物を整理しました。",
  "body": "1段落目\n\n2段落目",
  "thumbnailLabel": "Guide",
  "authorName": "Adlib-go 運営",
  "isPublished": true
}
```

response 201:

```json
{
  "column": {
    "id": "column-id",
    "slug": "kickoff-guide",
    "title": "KICK-OFF セッションの歩き方",
    "isPublished": true
  }
}
```

response 409:

```json
{
  "error": "slug already exists"
}
```

### 8.3 GET /api/columns/:slug

用途:

- 指定した slug のコラム詳細を返す

query:

- `includeDraft=1` を付けた場合、admin 権限では draft も取得できる

### 8.4 PATCH /api/columns/:slug

用途:

- 管理者が既存コラムを更新する

権限:

- admin

補足:

- `slug` 自体の変更も可能
- `isPublished` を `true` にした時点で `publishedAt` が未設定なら現在時刻を入れる
- `isPublished` を `false` にすると `publishedAt` は `null` になる

### 8.5 DELETE /api/columns/:slug

用途:

- 管理者がコラムを削除する

権限:

- admin

## 4.5 メンバープロフィール API

### 4.5.1 GET /api/members/me

用途:

- サインイン中メンバーのプロフィールを取得する

権限:

- MemberProfile保有ユーザー（member / admin）

### 4.5.2 PATCH /api/members/me

用途:

- サインイン中メンバーのプロフィールを更新する

## 5. sessionSet 生成 API

### 5.1 POST /api/session-sets/generate

用途:

- 指定 SessionEvent の SessionEntryRequest を元に sessionSet を生成する

権限:

- admin

request:

```json
{
  "sessionEventId": "event-id"
}
```

補足:

- `ParticipantSongRequest` は生成元に使わない
- 募集受付中の SessionEvent には実行できない

response 200:

```json
{
  "sessionEventId": "event-id",
  "sessionSets": [],
  "forcedSessionSets": [],
  "skippedSongs": []
}
```

response 400 例:

```json
{
  "error": "SessionEvent is still accepting entries"
}
```

## 5. レイティング API

### 5.0 POST /api/session-events/:id/publish

用途:

- 指定 SessionEvent に属する sessionSet を公開確定する

権限:

- admin

### 5.1 POST /api/session-sets/:id/ratings

用途:

- メンバーが公開済み sessionSet に星評価を登録する

権限:

- MemberProfile保有ユーザー（member / admin）

request:

```json
{
  "rating": 4,
  "comment": "テンポ感が良かったです"
}
```

バリデーション:

- rating は 1 以上 5 以下の整数
- 同一ユーザーの同一 sessionSet への保存は upsert とし、再投稿時は上書きする
- 公開済みかつ SessionEvent が `published` または `closed` の場合のみ評価できる

response 201:

```json
{
  "rating": {
    "id": "rating-id",
    "sessionSetId": "set-id",
    "userAccountId": "user-id",
    "rating": 4,
    "comment": "テンポ感が良かったです",
    "ratedAt": "2026-05-17T06:20:00.000Z"
  }
}
```

response 400:

```json
{
  "error": "rating must be an integer between 1 and 5"
}
```

### 5.2 GET /api/session-sets/:id/ratings/summary

用途:

- 管理者が対象セットの集計結果を確認する

権限:

- admin

response 200:

```json
{
  "summary": {
    "sessionSetId": "set-id",
    "ratingCount": 12,
    "averageRating": 4.25,
    "minRating": 3,
    "maxRating": 5,
    "distribution": {
      "1": 0,
      "2": 0,
      "3": 2,
      "4": 5,
      "5": 5
    },
    "ratedMemberCount": 12
  }
}
```

### 5.3 GET /api/session-events/:id/ratings-summary

用途:

- 管理者が対象イベント配下の全 sessionSet の集計結果を一覧で確認する

権限:

- admin

## 6. アーカイブ API

### 6.1 GET /api/session-archives

用途:

- ログインユーザーが終了イベントのアーカイブ一覧を取得する

権限:

- member / admin
- admin が includeDeleted=true を付与すると削除済みを含めて返す
- member が includeDeleted=true を付与しても削除済みは返さない

response 200:

```json
{
  "archives": [
    {
      "id": "archive-id",
      "sessionEventId": "event-id",
      "sessionEventTitle": "2026年5月セッション",
      "title": "2026年5月セッション 初版アーカイブ",
      "version": 1,
      "eventDate": "2026-05-17T00:00:00.000Z",
      "venue": "渋谷 Jazz Spot",
      "participantCount": 28,
      "participants": [
        {
          "id": "archive-participant-id",
          "displayName": "佐藤 匠",
          "mainInstrument": "drum"
        }
      ],
      "sets": [
        {
          "id": "archive-set-id",
          "songTitle": "Autumn Leaves",
          "setOrder": 1,
          "drumName": "佐藤 匠",
          "bassName": "鈴木 健",
          "pianoName": "高橋 葵",
          "frontSnapshot": ["田中 陽"],
          "vocalSnapshot": ["伊藤 凛"],
          "keyName": "Gm",
          "ratingSummary": {
            "ratingCount": 4,
            "averageRating": 4.25,
            "minRating": 3,
            "maxRating": 5,
            "distribution": {
              "1": 0,
              "2": 0,
              "3": 1,
              "4": 1,
              "5": 2
            }
          }
        }
      ],
      "setCount": 12,
      "ratingCount": 48,
      "deletedAt": null,
      "createdAt": "2026-05-17T03:00:00.000Z",
      "createdBy": {
        "id": "admin-user-id",
        "email": "admin@example.com"
      }
    }
  ],
  "includeDeleted": false
}
```

補足:

- 元イベント削除後もアーカイブは取得でき、その場合の `sessionEventId` は `null`
- `title`、開催日、会場、参加者、sessionSet、評価集計はアーカイブ自身のスナップショットから返す
- member のレスポンスには管理情報である `createdBy` を含めない

### 6.2 GET /api/session-events/:id/archive-preview

用途:

- 管理者が保存前にスナップショット内容を確認する

権限:

- admin

response 200:

```json
{
  "preview": {
    "sessionEventId": "event-id",
    "eventDate": "2026-05-17T00:00:00.000Z",
    "venue": "渋谷 Jazz Spot",
    "participantCount": 28,
    "setCount": 12,
    "ratingSummaryIncluded": true
  }
}
```

### 6.3 POST /api/session-archives

用途:

- 管理者が指定 SessionEvent の公開済み sessionSet をアーカイブ保存する

権限:

- admin

request:

```json
{
  "sessionEventId": "event-id",
  "title": "2026年5月セッション 初版アーカイブ",
  "note": "本番開始前の構成保存"
}
```

response 201:

```json
{
  "archive": {
    "id": "archive-id",
    "sessionEventId": "event-id",
    "version": 1,
    "createdAt": "2026-05-17T03:00:00.000Z"
  }
}
```

### 6.4 DELETE /api/session-archives/:id

用途:

- 管理者がアーカイブを削除する

権限:

- admin

動作:

- 即時に deletedAt を設定して通常一覧から除外する
- AdminAuditLog に archive_deleted を記録する

response 200:

```json
{
  "deleted": true,
  "archiveId": "archive-id",
  "deletedAt": "2026-05-18T01:10:00.000Z",
  "auditLogId": "audit-log-id"
}
```

response 404:

```json
{
  "error": "archive not found"
}
```

## 6.5 メンバーメッセージ API

### 6.5.1 POST /api/member-messages

用途:

- メンバーマイページから管理者へメッセージを送信する
- メッセージをDBへ保存した後、`CONTACT_TO_EMAIL` へ通知メールを送信する

権限:

- 有効な `MemberProfile` を持つ認証済みユーザー

request:

```json
{
  "subject": "次回イベントについて",
  "body": "管理者への連絡内容"
}
```

response 201:

```json
{
  "message": {
    "id": "message-id",
    "senderDisplayName": "山田 太郎",
    "senderEmail": "member@example.com",
    "subject": "次回イベントについて",
    "body": "管理者への連絡内容",
    "createdAt": "2026-07-27T03:00:00.000Z"
  },
  "notificationSent": true
}
```

補足:

- 件名は120文字以内、本文は2,000文字以内
- 制御文字を除去し、プレーンテキストとして保存・メール送信する
- 通知メールの `Reply-To` は送信メンバーのメールアドレス
- 通知に失敗してもメッセージは保存し、`notificationSent: false` と `warning` を返す

### 6.5.2 GET /api/member-messages

用途:

- 管理ダッシュボードに新しい順でメンバーメッセージを表示する

権限:

- admin

response 200:

```json
{
  "messages": [
    {
      "id": "message-id",
      "senderDisplayName": "山田 太郎",
      "senderEmail": "member@example.com",
      "subject": "次回イベントについて",
      "body": "管理者への連絡内容",
      "createdAt": "2026-07-27T03:00:00.000Z"
    }
  ]
}
```

## 7. 共通エラー形式

```json
{
  "error": "forbidden",
  "message": "admin role is required"
}
```
