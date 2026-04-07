# Adolib-go KICK-OFF DBテーブル案

## 1. 文書概要

本書は、Adolib-go KICK-OFF で想定する DB テーブル案を整理したものです。

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

## 4. リレーション方針

- UserAccount 1 : 1 MemberProfile
- SessionEvent 1 : N SessionEntry
- SessionEntry 1 : N SessionEntryRequest
- SessionEvent 1 : N SessionSet
- SessionSet 1 : N SessionSetMember
- DirectMessageRoom 1 : N DirectMessage
- GroupChat 1 : N GroupMessage
- GroupChat 1 : N GroupChatMember

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
6. Announcement
7. MailLog
8. Column
9. DirectMessage / GroupChat 系
