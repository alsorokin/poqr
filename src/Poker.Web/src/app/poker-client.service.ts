import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { ErrorEnvelope, RoomState, SessionJoinResponse } from './poker.types';

@Injectable({ providedIn: 'root' })
export class PokerClientService {
  private readonly apiBase: string;
  private hub: HubConnection | null = null;

  readonly state$ = new Subject<RoomState>();
  readonly error$ = new Subject<string>();
  readonly sessionClosed$ = new Subject<string>();

  constructor(private readonly http: HttpClient) {
    const { hostname, port, origin } = window.location;
    this.apiBase = port === '4200' ? `http://${hostname}:5057` : origin;
  }

  createSession(participantName: string) {
    return this.http.post<SessionJoinResponse>(`${this.apiBase}/api/sessions`, {
      participantName
    });
  }

  joinSession(sessionId: string, participantName: string, participantId: string | null) {
    return this.http.post<SessionJoinResponse>(`${this.apiBase}/api/sessions/${sessionId}/join`, {
      participantName,
      participantId
    });
  }

  async connect(sessionId: string, participantId: string): Promise<void> {
    if (!this.hub) {
      this.hub = new HubConnectionBuilder().withUrl(`${this.apiBase}/hubs/poker`).withAutomaticReconnect().build();

      this.hub.on('RoomStateUpdated', (envelope: { state: RoomState }) => {
        this.state$.next(envelope.state);
      });

      this.hub.on('Error', (envelope: ErrorEnvelope) => {
        this.error$.next(envelope.message);
      });

      this.hub.on('SessionClosed', (envelope: ErrorEnvelope) => {
        this.sessionClosed$.next(envelope.message);
      });

      await this.hub.start();
    }

    await this.hub.invoke('JoinSession', { sessionId, participantId });
  }

  async startRound(sessionId: string, participantId: string) {
    await this.hub?.invoke('StartRound', { sessionId, participantId });
  }

  async castVote(sessionId: string, participantId: string, roundId: string, value: string) {
    await this.hub?.invoke('CastVote', { sessionId, participantId, roundId, value });
  }

  async revealRound(sessionId: string, participantId: string, roundId: string) {
    await this.hub?.invoke('RevealRound', { sessionId, participantId, roundId });
  }

  async leaveSession(sessionId: string, participantId: string) {
    await this.hub?.invoke('LeaveSession', { sessionId, participantId });
    await this.hub?.stop();
    this.hub = null;
  }
}
