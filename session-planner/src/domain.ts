export type Instrument = 'drum' | 'bass' | 'piano' | 'front' | 'vocal';

// 1回目/2回目どちらで出した曲か
export type RequestRound = 1 | 2;

export interface RequestedSong {
  title: string;
  /** vocal のときのみ必須 */
  key?: string;
  /** 1回目 or 2回目 */
  round: RequestRound;
}

export interface Participant {
  id: string;
  name: string;
  instrument: Instrument;
  /** front のときのみ任意で使用 */
  subInstrument?: string;
  /**
   * non-vocal: round=1 が2件 + round=2 が2件 → 合計4
   * vocal:     round=1 が4件、round=2 はなし → 合計4
   */
  requestedSongs: RequestedSong[];
}

// 曲1曲分のセッション構成
export interface SessionSet {
  songTitle: string;
  drum?: string;   // participant.id
  bass?: string;   // participant.id
  piano?: string;  // participant.id
  front: string[]; // participant.id の配列（front + vocal を含めてもよい）
  key?: string;    // vocal が歌うときのキー
}

export interface SkippedSong {
  songTitle: string;
  reasons: string[];
}

export interface ForcedSessionSet {
  songTitle: string;
  forcedInstruments: Instrument[];
  requesterCount: number;
}

export interface SessionGenerationResult {
  sessionSets: SessionSet[];
  skippedSongs: SkippedSong[];
  forcedSessionSets: ForcedSessionSet[];
}
