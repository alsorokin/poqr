export interface Participant {
  participantId: string;
  name: string;
  isConnected: boolean;
}

export interface RoundState {
  roundId: string;
  isRevealed: boolean;
  votedParticipantIds: string[];
  revealedVotes: Record<string, number> | null;
  average: number | null;
}

export interface RoomState {
  sessionId: string;
  participants: Participant[];
  currentRound: RoundState | null;
  cardValues: number[];
}

export interface SessionJoinResponse {
  sessionId: string;
  participantId: string;
  state: RoomState;
}

export interface ErrorEnvelope {
  message: string;
}
