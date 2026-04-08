"use client";

import { useEffect, useState } from "react";

type Instrument = "drum" | "bass" | "piano" | "front" | "vocal";

interface Participant {
  id: string;
  name: string;
  instrument: Instrument;
  requestedSongs: {
    id: string;
    round: 1 | 2;
    keyName?: string | null;
    song: {
      id: string;
      title: string;
    };
  }[];
}

interface Song {
  id: string;
  title: string;
}

interface SessionSetView {
  id: string;
  songTitle: string;
  key?: string | null;
  drum: { id: string; name: string } | null;
  bass: { id: string; name: string } | null;
  piano: { id: string; name: string } | null;
  front?: { id: string; name: string }[];
  vocal?: { id: string; name: string }[];
}

interface SkippedSongView {
  songTitle: string;
  reasons: string[];
}

interface ForcedSessionSetView {
  songTitle: string;
  forcedInstruments: Instrument[];
  requesterCount: number;
}

interface AuthUser {
  id: string;
  email: string;
  role: "member" | "admin";
  status: string;
  memberProfile?: {
    id: string;
    displayName: string;
    mainInstrument: Instrument;
    nickname?: string | null;
    area?: string | null;
    bio?: string | null;
    subInstrument?: string | null;
  } | null;
}

interface SessionEventView {
  id: string;
  title: string;
  description?: string | null;
  venue: string;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  round1StartAt?: string | null;
  round1EndAt?: string | null;
  round2StartAt?: string | null;
  round2EndAt?: string | null;
  status: string;
  _count?: {
    sessionEntries: number;
    sessionSets: number;
  };
}

interface SessionEntryView {
  id: string;
  sessionEventId: string;
  attendanceStatus: "attending" | "absent" | "undecided";
  sessionEvent: {
    id: string;
    title: string;
    venue: string;
    eventDate: string;
  };
  requests: {
    id: string;
    songTitleSnapshot: string;
    round: number;
    priority: number;
    keyName?: string | null;
  }[];
}

export default function HomePage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [sessionSets, setSessionSets] = useState<SessionSetView[]>([]);
  const [skippedSongs, setSkippedSongs] = useState<SkippedSongView[]>([]);
  const [forcedSessionSets, setForcedSessionSets] = useState<ForcedSessionSetView[]>([]);
  const [sessionEvents, setSessionEvents] = useState<SessionEventView[]>([]);
  const [sessionEntries, setSessionEntries] = useState<SessionEntryView[]>([]);

  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantInstrument, setNewParticipantInstrument] =
    useState<Instrument>("drum");

  const [newSongTitle, setNewSongTitle] = useState("");

  const [requestParticipantId, setRequestParticipantId] = useState("");
  const [requestSongTitle, setRequestSongTitle] = useState("");
  const [requestRound, setRequestRound] = useState<1 | 2>(1);
  const [requestKeyName, setRequestKeyName] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("admin@adolib-go.local");
  const [authPassword, setAuthPassword] = useState("demo-admin-password");
  const [signupDisplayName, setSignupDisplayName] = useState("");
  const [signupInstrument, setSignupInstrument] = useState<Instrument>("front");
  const [resetEmail, setResetEmail] = useState("admin@adolib-go.local");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [issuedResetToken, setIssuedResetToken] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileNickname, setProfileNickname] = useState("");
  const [profileArea, setProfileArea] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileSubInstrument, setProfileSubInstrument] = useState("");
  const [eventTitle, setEventTitle] = useState("2026年6月 セッション");
  const [eventVenue, setEventVenue] = useState("渋谷 Jazz Spot");
  const [eventDate, setEventDate] = useState("2026-06-21");
  const [memberEventId, setMemberEventId] = useState("");
  const [memberAttendanceStatus, setMemberAttendanceStatus] = useState<"attending" | "absent" | "undecided">("attending");
  const [memberRound1Song1, setMemberRound1Song1] = useState("");
  const [memberRound1Song2, setMemberRound1Song2] = useState("");
  const [memberRound2Song1, setMemberRound2Song1] = useState("");
  const [memberRound2Song2, setMemberRound2Song2] = useState("");
  const [memberRound1Key1, setMemberRound1Key1] = useState("");
  const [memberRound1Key2, setMemberRound1Key2] = useState("");
  const [memberRound2Key1, setMemberRound2Key1] = useState("");
  const [memberRound2Key2, setMemberRound2Key2] = useState("");
  const isAdmin = currentUser?.role === "admin";
  const isMember = currentUser?.role === "member";

  const loadCurrentUser = async () => {
    const res = await fetch("/api/auth/me");
    const json = await res.json().catch(() => ({}));
    setCurrentUser(json.user ?? null);
  };

  const loadAll = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [pRes, sRes, ssRes, seRes, meRes] = await Promise.all([
        fetch("/api/participants"),
        fetch("/api/songs"),
        fetch("/api/session-sets"),
        fetch("/api/session-events"),
        fetch("/api/auth/me"),
      ]);
      const pJson = await pRes.json();
      const sJson = await sRes.json();
      const ssJson = await ssRes.json();
      const seJson = await seRes.json();
      const meJson = await meRes.json();
      setParticipants(pJson.participants ?? []);
      setSongs(sJson.songs ?? []);
      setSessionSets(ssJson.sessionSets ?? []);
      setSessionEvents(seJson.sessionEvents ?? []);
      setCurrentUser(meJson.user ?? null);
      if (meJson.user?.role === "member") {
        const entryRes = await fetch("/api/session-entries");
        const entryJson = await entryRes.json().catch(() => ({}));
        setSessionEntries(entryJson.entries ?? []);
      } else {
        setSessionEntries([]);
      }
      setSkippedSongs([]);
      setForcedSessionSets([]);
    } catch (e) {
      console.error(e);
      setMessage("データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (currentUser?.memberProfile) {
      setProfileDisplayName(currentUser.memberProfile.displayName ?? "");
      setProfileNickname(currentUser.memberProfile.nickname ?? "");
      setProfileArea(currentUser.memberProfile.area ?? "");
      setProfileBio(currentUser.memberProfile.bio ?? "");
      setProfileSubInstrument(currentUser.memberProfile.subInstrument ?? "");
    }
  }, [currentUser]);

  useEffect(() => {
    if (!memberEventId && sessionEvents.length > 0) {
      setMemberEventId(sessionEvents[0].id);
    }
  }, [memberEventId, sessionEvents]);

  const handleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      setCurrentUser(json.user ?? null);
      setMessage("サインインしました");
    } catch (e: any) {
      setMessage(`サインインに失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          displayName: signupDisplayName,
          mainInstrument: signupInstrument,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      setCurrentUser(json.user ?? null);
      setMessage("サインアップしました");
    } catch (e: any) {
      setMessage(`サインアップに失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      setCurrentUser(null);
      setMessage("サインアウトしました");
      await loadAll();
    } catch (e) {
      console.error(e);
      setMessage("サインアウトに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      setIssuedResetToken(json.resetToken ?? null);
      setResetToken(json.resetToken ?? "");
      setMessage("再設定トークンを発行しました");
    } catch (e: any) {
      setMessage(`再設定トークン発行に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: resetPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      setMessage("パスワードを更新しました");
      setIssuedResetToken(null);
      setResetToken("");
      setResetPassword("");
    } catch (e: any) {
      setMessage(`パスワード更新に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/members/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profileDisplayName,
          nickname: profileNickname,
          area: profileArea,
          bio: profileBio,
          subInstrument: profileSubInstrument,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadCurrentUser();
      setMessage("プロフィールを更新しました");
    } catch (e: any) {
      setMessage(`プロフィール更新に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSessionEvent = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/session-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle,
          venue: eventVenue,
          eventDate,
          status: "draft",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadAll();
      setMessage("セッションイベントを作成しました");
    } catch (e: any) {
      setMessage(`セッションイベント作成に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSessionEntry = async () => {
    if (!memberEventId) return;

    const requests = [
      { songTitle: memberRound1Song1.trim(), round: 1 as const, priority: 1, keyName: memberRound1Key1.trim() || null },
      { songTitle: memberRound1Song2.trim(), round: 1 as const, priority: 2, keyName: memberRound1Key2.trim() || null },
      { songTitle: memberRound2Song1.trim(), round: 2 as const, priority: 1, keyName: memberRound2Key1.trim() || null },
      { songTitle: memberRound2Song2.trim(), round: 2 as const, priority: 2, keyName: memberRound2Key2.trim() || null },
    ].filter((item) => item.songTitle);

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/session-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionEventId: memberEventId,
          attendanceStatus: memberAttendanceStatus,
          requests,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadAll();
      setMessage("セッションエントリーを保存しました");
    } catch (e: any) {
      setMessage(`セッションエントリー保存に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newParticipantName.trim(),
          instrument: newParticipantInstrument,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "failed");
      }
      setNewParticipantName("");
      await loadAll();
      setMessage("参加者を追加しました");
    } catch (e: any) {
      setMessage(`参加者追加に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = async () => {
    if (!newSongTitle.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSongTitle.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "failed");
      }
      setNewSongTitle("");
      await loadAll();
      setMessage("曲を追加しました");
    } catch (e: any) {
      setMessage(`曲追加に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequest = async () => {
    if (!requestParticipantId || !requestSongTitle.trim()) return;
    const participant = participants.find((p) => p.id === requestParticipantId);
    const round = requestRound;
    const body: any = {
      participantId: requestParticipantId,
      songTitle: requestSongTitle.trim(),
      round,
    };
    if (participant?.instrument === "vocal") {
      body.keyName = requestKeyName.trim();
    } else if (requestKeyName.trim()) {
      body.keyName = requestKeyName.trim();
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j.error ?? "failed");
      }
      setRequestSongTitle("");
      setRequestKeyName("");
      await loadAll();
      setMessage("希望曲を登録しました");
    } catch (e: any) {
      setMessage(`希望曲登録に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSessionSets = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/session-sets/generate", {
        method: "POST",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j.error ?? "failed");
      }
      setSessionSets(j.sessionSets ?? []);
      setSkippedSongs(j.skippedSongs ?? []);
      setForcedSessionSets(j.forcedSessionSets ?? []);
      setMessage(
        `sessionSet を生成しました: ${j.sessionSets?.length ?? 0} 曲、強制追加 ${j.forcedSessionSets?.length ?? 0} 曲、未生成 ${j.skippedSongs?.length ?? 0} 曲`,
      );
    } catch (e: any) {
      setMessage(`sessionSet 生成に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 1000, margin: "0 auto" }}>
      <h1>Jazz Session Planner</h1>
      <p>参加者・曲・希望曲を登録し、セッション構成を自動生成します。</p>
      <section style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "0.5rem" }}>
        <h2>認証</h2>
        <p style={{ color: "#555" }}>
          デモ管理者: admin@adolib-go.local / demo-admin-password
        </p>
        {currentUser ? (
          <div>
            <p>
              サインイン中: <strong>{currentUser.email}</strong> ({currentUser.role})
              {currentUser.memberProfile?.displayName ? ` / ${currentUser.memberProfile.displayName}` : ""}
            </p>
            <button type="button" onClick={handleSignOut} disabled={loading}>
              サインアウト
            </button>
            {currentUser.memberProfile && (
              <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
                <h3>プロフィール編集</h3>
                <input type="text" placeholder="表示名" value={profileDisplayName} onChange={(e) => setProfileDisplayName(e.target.value)} />
                <input type="text" placeholder="ニックネーム" value={profileNickname} onChange={(e) => setProfileNickname(e.target.value)} />
                <input type="text" placeholder="サブ楽器" value={profileSubInstrument} onChange={(e) => setProfileSubInstrument(e.target.value)} />
                <input type="text" placeholder="住処" value={profileArea} onChange={(e) => setProfileArea(e.target.value)} />
                <textarea placeholder="自己紹介" value={profileBio} onChange={(e) => setProfileBio(e.target.value)} rows={3} />
                <div>
                  <button type="button" onClick={handleProfileUpdate} disabled={loading}>
                    プロフィール保存
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <button type="button" onClick={() => setAuthMode("signin")} disabled={loading || authMode === "signin"}>
                サインイン
              </button>
              <button type="button" onClick={() => setAuthMode("signup")} disabled={loading || authMode === "signup"}>
                サインアップ
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <input type="email" placeholder="メールアドレス" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
              <input type="password" placeholder="パスワード" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
              {authMode === "signup" && (
                <>
                  <input type="text" placeholder="表示名" value={signupDisplayName} onChange={(e) => setSignupDisplayName(e.target.value)} />
                  <select value={signupInstrument} onChange={(e) => setSignupInstrument(e.target.value as Instrument)}>
                    <option value="drum">drum</option>
                    <option value="bass">bass</option>
                    <option value="piano">piano</option>
                    <option value="front">front</option>
                    <option value="vocal">vocal</option>
                  </select>
                </>
              )}
              <button
                type="button"
                onClick={authMode === "signin" ? handleSignIn : handleSignUp}
                disabled={loading}
              >
                {authMode === "signin" ? "実行" : "登録"}
              </button>
            </div>
            <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
              <h3>パスワード再設定</h3>
              <input type="email" placeholder="メールアドレス" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              <div>
                <button type="button" onClick={handleForgotPassword} disabled={loading}>
                  再設定トークンを発行
                </button>
              </div>
              {issuedResetToken && (
                <p style={{ color: "#555", wordBreak: "break-all" }}>
                  開発用トークン: {issuedResetToken}
                </p>
              )}
              <input type="text" placeholder="再設定トークン" value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
              <input type="password" placeholder="新しいパスワード" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
              <div>
                <button type="button" onClick={handleResetPassword} disabled={loading}>
                  パスワード更新
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {message && (
        <p style={{ color: "darkgreen", marginTop: "0.5rem" }}>{message}</p>
      )}
      {loading && <p style={{ color: "gray" }}>処理中...</p>}

      {isMember && (
        <section style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "0.5rem" }}>
          <h2>メンバー画面</h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <h3>セッションイベント一覧</h3>
              {sessionEvents.length === 0 ? (
                <p>開催予定のイベントはありません。</p>
              ) : (
                <ul>
                  {sessionEvents.map((event) => (
                    <li key={event.id}>
                      <strong>{event.title}</strong> / {event.venue} / {new Date(event.eventDate).toLocaleDateString("ja-JP")}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3>セッションエントリー</h3>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <select value={memberEventId} onChange={(e) => setMemberEventId(e.target.value)}>
                  <option value="">イベントを選択</option>
                  {sessionEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
                <select value={memberAttendanceStatus} onChange={(e) => setMemberAttendanceStatus(e.target.value as "attending" | "absent" | "undecided") }>
                  <option value="attending">attending</option>
                  <option value="undecided">undecided</option>
                  <option value="absent">absent</option>
                </select>
                <input type="text" placeholder="Round 1 - 1曲目" value={memberRound1Song1} onChange={(e) => setMemberRound1Song1(e.target.value)} list="song-titles" />
                <input type="text" placeholder="Round 1 - 1曲目 key" value={memberRound1Key1} onChange={(e) => setMemberRound1Key1(e.target.value)} />
                <input type="text" placeholder="Round 1 - 2曲目" value={memberRound1Song2} onChange={(e) => setMemberRound1Song2(e.target.value)} list="song-titles" />
                <input type="text" placeholder="Round 1 - 2曲目 key" value={memberRound1Key2} onChange={(e) => setMemberRound1Key2(e.target.value)} />
                <input type="text" placeholder="Round 2 - 1曲目" value={memberRound2Song1} onChange={(e) => setMemberRound2Song1(e.target.value)} list="song-titles" />
                <input type="text" placeholder="Round 2 - 1曲目 key" value={memberRound2Key1} onChange={(e) => setMemberRound2Key1(e.target.value)} />
                {!currentUser?.memberProfile || currentUser.memberProfile.mainInstrument !== "vocal" ? (
                  <>
                    <input type="text" placeholder="Round 2 - 2曲目" value={memberRound2Song2} onChange={(e) => setMemberRound2Song2(e.target.value)} list="song-titles" />
                    <input type="text" placeholder="Round 2 - 2曲目 key" value={memberRound2Key2} onChange={(e) => setMemberRound2Key2(e.target.value)} />
                  </>
                ) : null}
                <div>
                  <button type="button" onClick={handleSubmitSessionEntry} disabled={loading || !memberEventId}>
                    エントリー保存
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3>自分のエントリー履歴</h3>
              {sessionEntries.length === 0 ? (
                <p>まだエントリーはありません。</p>
              ) : (
                <ul>
                  {sessionEntries.map((entry) => (
                    <li key={entry.id} style={{ marginBottom: "0.75rem" }}>
                      <strong>{entry.sessionEvent.title}</strong> ({entry.attendanceStatus})
                      <ul>
                        {entry.requests.map((request) => (
                          <li key={request.id}>
                            Round {request.round} / {request.priority}: {request.songTitleSnapshot}
                            {request.keyName ? ` (key: ${request.keyName})` : ""}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {isAdmin && (
      <section style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "0.5rem" }}>
        <h2>管理者ダッシュボード</h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <h3>セッションイベント管理</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <input type="text" placeholder="イベント名" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
              <input type="text" placeholder="会場" value={eventVenue} onChange={(e) => setEventVenue(e.target.value)} />
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              <button type="button" onClick={handleCreateSessionEvent} disabled={loading}>
                イベント作成
              </button>
            </div>
            <ul style={{ marginTop: "0.5rem" }}>
              {sessionEvents.map((event) => (
                <li key={event.id}>
                  <strong>{event.title}</strong> / {event.venue} / {new Date(event.eventDate).toLocaleDateString("ja-JP")} / status: {event.status}
                  {event._count ? ` / entries: ${event._count.sessionEntries} / sets: ${event._count.sessionSets}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      )}

      {isAdmin && (
      <>
      <section style={{ marginTop: "2rem" }}>
        <h2>1. 参加者の登録</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="名前"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
          />
          <select
            value={newParticipantInstrument}
            onChange={(e) => setNewParticipantInstrument(e.target.value as Instrument)}
          >
            <option value="drum">drum</option>
            <option value="bass">bass</option>
            <option value="piano">piano</option>
            <option value="front">front</option>
            <option value="vocal">vocal</option>
          </select>
          <button type="button" onClick={handleAddParticipant} disabled={loading || !isAdmin}>
            追加
          </button>
        </div>
        {!isAdmin && <p style={{ color: "#a33" }}>追加操作には管理者サインインが必要です。</p>}
        <ul style={{ marginTop: "0.5rem" }}>
          {participants.map((p) => (
            <li key={p.id} style={{ marginBottom: "0.75rem" }}>
              {(() => {
                const round1Requests = [...p.requestedSongs]
                  .filter((request) => request.round === 1)
                  .sort((a, b) => a.song.title.localeCompare(b.song.title));
                const round2Requests = [...p.requestedSongs]
                  .filter((request) => request.round === 2)
                  .sort((a, b) => a.song.title.localeCompare(b.song.title));

                return (
                  <>
                    <div>
                      <strong>{p.name}</strong> ({p.instrument})
                    </div>
                    {p.requestedSongs.length === 0 ? (
                      <div style={{ color: "#666" }}>希望曲なし</div>
                    ) : (
                      <div style={{ marginTop: "0.25rem" }}>
                        <div>
                          <strong>Round 1</strong>
                        </div>
                        {round1Requests.length === 0 ? (
                          <div style={{ color: "#666" }}>なし</div>
                        ) : (
                          <ul style={{ marginTop: "0.15rem" }}>
                            {round1Requests.map((request) => (
                              <li key={request.id}>
                                {request.song.title}
                                {request.keyName ? ` (key: ${request.keyName})` : ""}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div style={{ marginTop: "0.35rem" }}>
                          <strong>Round 2</strong>
                        </div>
                        {round2Requests.length === 0 ? (
                          <div style={{ color: "#666" }}>なし</div>
                        ) : (
                          <ul style={{ marginTop: "0.15rem" }}>
                            {round2Requests.map((request) => (
                              <li key={request.id}>
                                {request.song.title}
                                {request.keyName ? ` (key: ${request.keyName})` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>2. 曲マスタの登録（任意）</h2>
        <p>round=1 の希望登録時に新曲は自動追加されるため、ここは任意です。</p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="曲名"
            value={newSongTitle}
            onChange={(e) => setNewSongTitle(e.target.value)}
          />
          <button type="button" onClick={handleAddSong} disabled={loading || !isAdmin}>
            追加
          </button>
        </div>
        {!isAdmin && <p style={{ color: "#a33" }}>追加操作には管理者サインインが必要です。</p>}
        <ul style={{ marginTop: "0.5rem" }}>
          {songs.map((s) => (
            <li key={s.id}>{s.title}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>3. 希望曲の登録</h2>
        <p>
          1回目(round=1) は新曲も入力可、2回目(round=2) は既存の曲名から選択してください。
          vocal は常に key を入力してください。
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={requestParticipantId}
            onChange={(e) => setRequestParticipantId(e.target.value)}
          >
            <option value="">参加者を選択</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.instrument})
              </option>
            ))}
          </select>

          <select
            value={requestRound}
            onChange={(e) => setRequestRound(Number(e.target.value) === 2 ? 2 : 1)}
          >
            <option value={1}>round 1</option>
            <option value={2}>round 2</option>
          </select>

          <input
            type="text"
            placeholder="曲名"
            value={requestSongTitle}
            onChange={(e) => setRequestSongTitle(e.target.value)}
            list="song-titles"
          />
          <datalist id="song-titles">
            {songs.map((s) => (
              <option key={s.id} value={s.title} />
            ))}
          </datalist>

          <input
            type="text"
            placeholder="キー (vocal のみ必須)"
            value={requestKeyName}
            onChange={(e) => setRequestKeyName(e.target.value)}
          />

          <button type="button" onClick={handleAddRequest} disabled={loading || !isAdmin}>
            希望を追加
          </button>
        </div>
        {!isAdmin && <p style={{ color: "#a33" }}>登録操作には管理者サインインが必要です。</p>}
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>4. sessionSet の生成</h2>
        <button type="button" onClick={handleGenerateSessionSets} disabled={loading || !isAdmin}>
          sessionSet を自動生成
        </button>
        {!isAdmin && <p style={{ color: "#a33" }}>生成操作には管理者サインインが必要です。</p>}

        <div style={{ marginTop: "1rem" }}>
          {sessionSets.length === 0 ? (
            <p>まだ sessionSet がありません。</p>
          ) : (
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                marginTop: "0.5rem",
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>曲名</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Key</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Drum</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Bass</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Piano</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Front</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Vocal</th>
                </tr>
              </thead>
              <tbody>
                {sessionSets.map((s) => (
                  <tr key={s.id}>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {s.songTitle}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {s.key ?? "-"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {s.drum?.name ?? "-"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {s.bass?.name ?? "-"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {s.piano?.name ?? "-"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {(s.front ?? []).map((f) => f.name).join(", ") || "-"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {(s.vocal ?? []).map((v) => v.name).join(", ") || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <h3>強制参加で追加生成された曲</h3>
          {forcedSessionSets.length === 0 ? (
            <p>強制追加された曲はありません。</p>
          ) : (
            <ul>
              {forcedSessionSets.map((song) => (
                <li key={song.songTitle} style={{ marginBottom: "0.5rem" }}>
                  <strong>{song.songTitle}</strong>
                  {` : 強制参加 ${song.forcedInstruments.join(", ")} / 他の希望者 ${song.requesterCount} 名`}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <h3>生成されなかった曲</h3>
          {skippedSongs.length === 0 ? (
            <p>未生成の曲はありません。</p>
          ) : (
            <ul>
              {skippedSongs.map((song) => (
                <li key={song.songTitle} style={{ marginBottom: "0.5rem" }}>
                  <strong>{song.songTitle}</strong>
                  <ul style={{ marginTop: "0.15rem" }}>
                    {song.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      </>
      )}
    </main>
  );
}
