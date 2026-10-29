export interface LeaderboardEntry {
  alias: string;
  name: string;
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
  alias: string;
  name: string;
  scores: MyScore[];
}

export interface GameEventSummary {
  id: string;
  title: string;
  company: string;
  location: string;
  eventDate: string;
  games: string[];
  givingUrl: string | null;
  participantCount: number;
}

export interface GameEventDetails {
  id: string;
  title: string;
  company: string;
  location: string;
  eventDate: string;
  games: string[];
  givingUrl: string | null;
}

export interface GameBoardResponse {
  me: GameMe | null;
  leaderboard: LeaderboardEntry[];
  recent: RecentScore[];
  games: string[];
}
