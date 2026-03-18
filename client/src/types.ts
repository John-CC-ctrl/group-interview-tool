export type FlagState = 'off' | 'yellow' | 'red';
export type Screen = 'setup' | 'interview' | 'summary' | 'past' | 'compare';

export interface Candidate {
  id: string;
  seatNumber: number;
  name: string;
  notes: string;
  answers: Record<string, string>; // 'Q1' through 'Q7'
  flags: Record<string, FlagState>;
  ratings: Record<string, number>; // category id -> 0-5
}

export interface Session {
  id: string;
  createdAt: string;
  seatCount: number;
  canvaUrl?: string;
  email?: string;
  concluded: boolean;
  candidates: Candidate[];
}

export interface SessionSummary {
  id: string;
  createdAt: string;
  seatCount: number;
  email?: string;
  concluded: boolean;
}
