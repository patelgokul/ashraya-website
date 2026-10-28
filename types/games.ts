export interface LeaderboardEntry {
  id: string;
  name: string;
  alias: string | null;
  rank: number;
  totalPoints: number;
  entries: number;
}

export interface RecentScore {
  id: string;
  participantName: string;
  game: string;
  points: number;
  createdAt: string;
}

export interface MyScore {
  id: string;
  game: string;
  points: number;
  createdAt: string;
}

export interface GameMe {
  id: string;
  name: string;
  scores: MyScore[];
}

export interface GameBoardResponse {
  me: GameMe | null;
  leaderboard: LeaderboardEntry[];
  recent: RecentScore[];
  games: string[];
}
