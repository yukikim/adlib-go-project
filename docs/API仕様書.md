# Adolib-go KICK-OFF API仕様書

## 1. 文書概要

本書は、KICK-OFF 拡張で追加する主要 API の request / response を具体化したものです。

前提:

- 認証済みメンバーは member 権限を持つ
- 管理系 API は admin 権限を持つユーザーのみ利用できる
- レスポンスは JSON とする

## 2. セッションイベント API

### 2.1 POST /api/session-events

用途:

- 管理者が新しいセッション開催情報を作成する

権限:

- admin

request:

```json
{
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

response 201:

```json
{
  "sessionEvent": {
    "id": "event-id",
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
  "error": "eventDate is required"
}
```

## 3. セッション参加 API

### 3.1 POST /api/session-entries

用途:

- メンバーが対象イベントへの参加可否と希望曲を登録する

権限:

- member

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
  "sessionEntry": {
    "id": "entry-id",
    "sessionEventId": "event-id",
    "memberProfileId": "member-id",
    "attendanceStatus": "attending",
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

## 4. レイティング API

### 4.1 POST /api/session-sets/:id/ratings

用途:

- メンバーが公開済み sessionSet に星評価を登録する

権限:

- member

request:

```json
{
  "sessionEventId": "event-id",
  "rating": 4,
  "comment": "テンポ感が良かったです"
}
```

バリデーション:

- rating は 1 以上 5 以下の整数
- 同一ユーザーの同一 sessionSet への登録は 1 件まで

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

response 409:

```json
{
  "error": "rating already exists for this session set"
}
```

### 4.2 GET /api/session-sets/:id/ratings/summary

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

## 5. アーカイブ API

### 5.1 GET /api/session-events/:id/archive-preview

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

### 5.2 POST /api/session-sets/:id/archive

用途:

- 管理者が任意時点の sessionSet をアーカイブ保存する

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
    "retentionUntil": "2029-05-17T00:00:00.000Z",
    "createdAt": "2026-05-17T03:00:00.000Z"
  }
}
```

### 5.3 DELETE /api/session-archives/:id

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

## 6. 共通エラー形式

```json
{
  "error": "forbidden",
  "message": "admin role is required"
}
```