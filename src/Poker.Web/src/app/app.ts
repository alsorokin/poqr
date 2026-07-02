import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PokerClientService } from './poker-client.service';
import { RoomState, SessionJoinResponse } from './poker.types';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  participantName = '';
  sessionInput = '';
  selectedCard: number | null = null;

  sessionId: string | null = null;
  participantId: string | null = null;
  roomState: RoomState | null = null;
  error = '';

  private subscriptions: Subscription[] = [];

  constructor(private readonly pokerClient: PokerClientService) {}

  get shareLink(): string {
    if (!this.sessionId) {
      return '';
    }

    return `${window.location.origin}?session=${this.sessionId}`;
  }

  get currentRoundId(): string | null {
    return this.roomState?.currentRound?.roundId ?? null;
  }

  get canStartRound(): boolean {
    return !!this.sessionId && !!this.participantId;
  }

  get canReveal(): boolean {
    return !!this.currentRoundId && this.roomState?.currentRound?.isRevealed === false;
  }

  get canVote(): boolean {
    return !!this.currentRoundId && this.roomState?.currentRound?.isRevealed === false;
  }

  ngOnInit(): void {
    const querySession = new URLSearchParams(window.location.search).get('session');
    if (querySession) {
      this.sessionInput = querySession.toUpperCase();
    }

    this.subscriptions.push(
      this.pokerClient.state$.subscribe((state) => {
        this.roomState = state;
      })
    );

    this.subscriptions.push(
      this.pokerClient.error$.subscribe((message) => {
        this.error = message;
      })
    );

    this.subscriptions.push(
      this.pokerClient.sessionClosed$.subscribe((message) => {
        this.error = message;
        this.resetRoom();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  createSession(): void {
    this.error = '';
    this.pokerClient.createSession(this.participantName).subscribe({
      next: (response) => this.handleJoined(response),
      error: () => {
        this.error = 'Unable to create a session.';
      }
    });
  }

  joinSession(): void {
    this.error = '';
    const rememberedParticipantId = this.readParticipantId(this.sessionInput);

    this.pokerClient.joinSession(this.sessionInput, this.participantName, rememberedParticipantId).subscribe({
      next: (response) => this.handleJoined(response),
      error: () => {
        this.error = 'Unable to join that session.';
      }
    });
  }

  async startRound(): Promise<void> {
    if (!this.sessionId || !this.participantId) {
      return;
    }

    this.selectedCard = null;
    await this.pokerClient.startRound(this.sessionId, this.participantId);
  }

  async vote(cardValue: number): Promise<void> {
    if (!this.sessionId || !this.participantId || !this.currentRoundId || !this.canVote) {
      return;
    }

    this.selectedCard = cardValue;
    await this.pokerClient.castVote(this.sessionId, this.participantId, this.currentRoundId, cardValue);
  }

  async reveal(): Promise<void> {
    if (!this.sessionId || !this.participantId || !this.currentRoundId) {
      return;
    }

    await this.pokerClient.revealRound(this.sessionId, this.participantId, this.currentRoundId);
  }

  async leave(): Promise<void> {
    if (!this.sessionId || !this.participantId) {
      this.resetRoom();
      return;
    }

    await this.pokerClient.leaveSession(this.sessionId, this.participantId);
    this.resetRoom();
  }

  hasVoted(participantId: string): boolean {
    return this.roomState?.currentRound?.votedParticipantIds.includes(participantId) ?? false;
  }

  revealedVote(participantId: string): string {
    const value = this.roomState?.currentRound?.revealedVotes?.[participantId];
    return value === undefined ? '—' : value.toString();
  }

  isSelected(cardValue: number): boolean {
    return this.selectedCard === cardValue;
  }

  private async handleJoined(response: SessionJoinResponse): Promise<void> {
    this.sessionId = response.sessionId;
    this.participantId = response.participantId;
    this.roomState = response.state;
    this.sessionInput = response.sessionId;

    this.storeParticipantId(response.sessionId, response.participantId);
    this.updateUrl(response.sessionId);
    await this.pokerClient.connect(response.sessionId, response.participantId);
  }

  private updateUrl(sessionId: string): void {
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.replaceState({}, '', url.toString());
  }

  private participantStorageKey(sessionId: string): string {
    return `poker.participant.${sessionId.toUpperCase()}`;
  }

  private storeParticipantId(sessionId: string, participantId: string): void {
    sessionStorage.setItem(this.participantStorageKey(sessionId), participantId);
  }

  private readParticipantId(sessionId: string): string | null {
    return sessionStorage.getItem(this.participantStorageKey(sessionId.toUpperCase()));
  }

  private resetRoom(): void {
    this.sessionId = null;
    this.participantId = null;
    this.roomState = null;
    this.selectedCard = null;
  }
}
