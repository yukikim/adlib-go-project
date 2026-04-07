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

export default function HomePage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [sessionSets, setSessionSets] = useState<SessionSetView[]>([]);
  const [skippedSongs, setSkippedSongs] = useState<SkippedSongView[]>([]);
  const [forcedSessionSets, setForcedSessionSets] = useState<ForcedSessionSetView[]>([]);

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

  const loadAll = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [pRes, sRes, ssRes] = await Promise.all([
        fetch("/api/participants"),
        fetch("/api/songs"),
        fetch("/api/session-sets"),
      ]);
      const pJson = await pRes.json();
      const sJson = await sRes.json();
      const ssJson = await ssRes.json();
      setParticipants(pJson.participants ?? []);
      setSongs(sJson.songs ?? []);
      setSessionSets(ssJson.sessionSets ?? []);
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

      {message && (
        <p style={{ color: "darkgreen", marginTop: "0.5rem" }}>{message}</p>
      )}
      {loading && <p style={{ color: "gray" }}>処理中...</p>}

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
          <button type="button" onClick={handleAddParticipant} disabled={loading}>
            追加
          </button>
        </div>
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
          <button type="button" onClick={handleAddSong} disabled={loading}>
            追加
          </button>
        </div>
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

          <button type="button" onClick={handleAddRequest} disabled={loading}>
            希望を追加
          </button>
        </div>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>4. sessionSet の生成</h2>
        <button type="button" onClick={handleGenerateSessionSets} disabled={loading}>
          sessionSet を自動生成
        </button>

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
    </main>
  );
}
