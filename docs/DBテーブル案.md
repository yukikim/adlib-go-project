# Adlib-go KICK-OFF DBテーブル案

## 1. 文書概要

本書は、Adlib-go KICK-OFF で想定する DB テーブル案を整理したものです。

既存 Prisma スキーマで実装済みのテーブルと、今後追加が必要なテーブルを分けて記載します。

## 2. 既存テーブル

### 2.1 Participant

用途:

- 参加者の基本情報を保持する

主なカラム案:

- id
- name
- instrument

### 2.2 Song

用途:

- 曲マスタを保持する

主なカラム案:

- id
- eventType
- title

### 2.3 ParticipantSongRequest

用途:

- 参加者ごとの希望曲を保持する

主なカラム案:

- id
- participantId
- songId
- keyName
- round

制約:

- participantId + songId をユニークにする

### 2.4 SessionSet

用途:

- 1 曲ごとの編成結果を保持する

主なカラム案:

- id
- title
- songId
- drumId
- bassId
- pianoId
- keyName

### 2.5 SessionSetMember

用途:

- front / vocal のメンバーを保持する

主なカラム案:

- id
- sessionSetId
- participantId
- role

## 3. 追加予定テーブル案

### 3.1 UserAccount

用途:

- ログイン認証アカウントを保持する

主なカラム案:

- id
- email
- passwordHash
- role
- status
- createdAt
- updatedAt

`eventType`:

- `song_request`: 希望曲・sessionSet・レイティングを使用する
- `attendance_only`: 参加回答だけを使用し、SessionEntryRequest は作成しない

### 3.2 MemberProfile

用途:

- メンバーの公開プロフィールを保持する

主なカラム案:

- id
- userAccountId
- displayName
- nickname
- mainInstrument
- subInstrument
- gender
- ageRange
- area
- bio
- createdAt
- updatedAt

### 3.3 SessionEvent

用途:

- セッション開催単位を保持する

主なカラム案:

- id
- title
- description
- venue
- eventDate
- startTime
- endTime
- round1StartAt
- round1EndAt
- round2StartAt
- round2EndAt
- status
- createdBy
- createdAt
- updatedAt

### 3.4 SessionEntry

用途:

- メンバーのセッション参加回答を保持する

主なカラム案:

- id
- sessionEventId
- memberProfileId
- attendanceStatus
- round
- createdAt
- updatedAt

### 3.5 SessionEntryRequest

用途:

- SessionEntry に紐づく希望曲を保持する

主なカラム案:

- id
- sessionEntryId
- songId
- songTitleSnapshot
- keyName
- priority

### 3.6 Announcement

用途:

- 管理者からのお知らせを保持する

主なカラム案:

- id
- title
- body
- publishedAt
- targetType
- createdBy

### 3.7 DirectMessageRoom

用途:

- 1 対 1 チャットの部屋を保持する

主なカラム案:

- id
- memberAId
- memberBId
- createdAt

### 3.8 DirectMessage

用途:

- 1 対 1 チャット本文を保持する

主なカラム案:

- id
- roomId
- senderId
- body
- sentAt
- readAt

### 3.9 GroupChat

用途:

- グループチャットの部屋を保持する

主なカラム案:

- id
- name
- createdBy
- createdAt

### 3.10 GroupChatMember

用途:

- グループチャット参加者を保持する

主なカラム案:

- id
- groupChatId
- memberProfileId
- joinedAt

### 3.11 GroupMessage

用途:

- グループチャット本文を保持する

主なカラム案:

- id
- groupChatId
- senderId
- body
- sentAt

### 3.12 MailLog

用途:

- メール送信履歴を保持する

主なカラム案:

- id
- mailType
- toAddress
- subject
- bodySummary
- status
- errorMessage
- sentAt

### 3.13 Column

用途:

- コラム記事を保持する

主なカラム案:

- id
- title
- slug
- summary
- body
- thumbnailUrl
- publishedAt
- createdBy
- status

### 3.14 SessionSetRating

用途:

- メンバーが各 sessionSet に対して入力したレイティングを保持する

主なカラム案:

- id
- sessionEventId
- sessionSetId
- memberProfileId
- rating
- comment
- ratedAt
- updatedAt

制約案:

- sessionSetId + memberProfileId をユニークにする
- rating は 1 から 5 の整数に制限する

### 3.15 SessionArchive

用途:

- セッション実施情報のアーカイブ本体を保持する

主なカラム案:

- id
- sessionEventId
- title
- eventDate
- venue
- participantCount
- participantListSnapshot
- note
- deletedAt
- createdBy
- createdAt

運用案:

- 管理者は必要に応じて削除できる

### 3.16 SessionArchiveSet

用途:

- アーカイブ保存時点の各セット情報を保持する

主なカラム案:

- id
- sessionArchiveId
- songTitle
- setOrder
- drumName
- bassName
- pianoName
- frontSnapshot
- vocalSnapshot
- keyName

### 3.17 SessionArchiveRatingSummary

用途:

- アーカイブ保存時点のセットごとのレイティング集計を保持する

主なカラム案:

- id
- sessionArchiveSetId
- ratingCount
- averageRating
- minRating
- maxRating
- distributionJson

### 3.18 AdminAuditLog

用途:

- 管理者の重要操作の監査ログを保持する

主なカラム案:

- id
- action
- targetType
- targetId
- summary
- payload
- performedById
- sessionArchiveId
- performedAt

## 4. リレーション方針

- UserAccount 1 : 1 MemberProfile
- SessionEvent 1 : N SessionEntry
- SessionEntry 1 : N SessionEntryRequest
- SessionEvent 1 : N SessionSet
- SessionEvent 1 : N SessionSetRating
- SessionEvent 1 : N SessionArchive
- SessionSet 1 : N SessionSetMember
- SessionSet 1 : N SessionSetRating
- DirectMessageRoom 1 : N DirectMessage
- GroupChat 1 : N GroupMessage
- GroupChat 1 : N GroupChatMember
- SessionArchive 1 : N SessionArchiveSet
- SessionArchiveSet 1 : 1 SessionArchiveRatingSummary
- UserAccount 1 : N AdminAuditLog
- SessionArchive 1 : N AdminAuditLog

## 5. マスタ項目案

- role
  - member
  - admin
- attendanceStatus
  - attending
  - absent
  - undecided
- sessionEvent status
  - draft
  - recruiting_round1
  - recruiting_round2
  - generating
  - published
  - closed

## 6. Prisma 化の優先順

1. UserAccount
2. MemberProfile
3. SessionEvent
4. SessionEntry
5. SessionEntryRequest
6. SessionSetRating
7. SessionArchive / SessionArchiveSet / SessionArchiveRatingSummary
8. AdminAuditLog
9. Announcement
10. MailLog
11. Column
12. DirectMessage / GroupChat 系
