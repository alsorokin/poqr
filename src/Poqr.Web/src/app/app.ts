import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PokerClientService } from './poker-client.service';
import { CinemaFruitEffect, CinemaLogoActivatedEnvelope, RoomState, SessionJoinResponse } from './poker.types';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private static readonly NEW_ROUND_REVEAL_DELAY_MS = 5000;
  private static readonly LAST_PARTICIPANT_NAME_STORAGE_KEY = 'poker.participantName';

  participantName = '';
  sessionInput = '';
  selectedCard: string | null = null;

  sessionId: string | null = null;
  participantId: string | null = null;
  roomState: RoomState | null = null;
  error = '';
  cinemaLogoAnimationKey = 0;
  cinemaFruitEffect: CinemaFruitEffect | null = null;
  cinemaFruitEffectIsExploding = false;
  cinemaFruitStartX = '0px';
  cinemaFruitStartY = '0px';
  cinemaFruitTargetX = '0px';
  cinemaFruitTargetY = '0px';

  private subscriptions: Subscription[] = [];
  private isStartNewVoteLocked = false;
  private startNewVoteLockTimeout: ReturnType<typeof setTimeout> | null = null;
  private previousRoundId: string | null = null;
  private previousRoundRevealed = false;
  private cinemaFruitExplosionTimeout: ReturnType<typeof setTimeout> | null = null;
  private cinemaFruitCleanupTimeout: ReturnType<typeof setTimeout> | null = null;

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

  get canStartNewVote(): boolean {
    return !!this.currentRoundId
      && this.roomState?.currentRound?.isRevealed === true
      && !this.isStartNewVoteLocked;
  }

  ngOnInit(): void {
    this.participantName = this.readParticipantName();

    const querySession = new URLSearchParams(window.location.search).get('session');
    if (querySession) {
      this.sessionInput = querySession.toUpperCase();
    }

    this.subscriptions.push(
      this.pokerClient.state$.subscribe((state) => {
        this.syncSelectedCard(state);
        this.updateStartNewVoteLock(state);
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

    this.subscriptions.push(
      this.pokerClient.cinemaLogoActivated$.subscribe((envelope) => {
        this.cinemaLogoAnimationKey += 1;
        this.showCinemaFruitEffect(envelope);
      })
    );
  }

  ngOnDestroy(): void {
    this.clearStartNewVoteLock();
    this.clearCinemaFruitEffect();
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

    if (this.roomState?.currentRound?.isRevealed && this.isStartNewVoteLocked) {
      return;
    }

    this.selectedCard = null;
    await this.pokerClient.startRound(this.sessionId, this.participantId);
  }

  async vote(cardValue: string): Promise<void> {
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

  async activateCinemaLogo(): Promise<void> {
    await this.pokerClient.activateCinemaLogo();
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
    return value === undefined ? '—' : this.cardLabel(value);
  }

  isSelected(cardValue: string): boolean {
    return this.selectedCard === cardValue;
  }

  cardLabel(cardValue: string): string {
    return cardValue === 'Joker' ? '✋🗿🤚' : cardValue;
  }

  private async handleJoined(response: SessionJoinResponse): Promise<void> {
    this.sessionId = response.sessionId;
    this.participantId = response.participantId;
    this.roomState = response.state;
    this.sessionInput = response.sessionId;

    this.storeParticipantName(this.participantName);
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

  private storeParticipantName(participantName: string): void {
    localStorage.setItem(App.LAST_PARTICIPANT_NAME_STORAGE_KEY, participantName.trim());
  }

  private readParticipantName(): string {
    return localStorage.getItem(App.LAST_PARTICIPANT_NAME_STORAGE_KEY) ?? '';
  }

  private resetRoom(): void {
    this.clearStartNewVoteLock();
    this.clearCinemaFruitEffect();
    this.previousRoundId = null;
    this.previousRoundRevealed = false;
    this.sessionId = null;
    this.participantId = null;
    this.roomState = null;
    this.selectedCard = null;
  }

  private syncSelectedCard(state: RoomState): void {
    const nextRoundId = state.currentRound?.roundId ?? null;

    if (nextRoundId !== this.currentRoundId) {
      this.selectedCard = null;
    }
  }

  private updateStartNewVoteLock(state: RoomState): void {
    const roundId = state.currentRound?.roundId ?? null;
    const isRevealed = state.currentRound?.isRevealed === true;

    const hasJustRevealed = !!roundId
      && isRevealed
      && (roundId !== this.previousRoundId || !this.previousRoundRevealed);

    if (hasJustRevealed) {
      this.isStartNewVoteLocked = true;
      this.clearStartNewVoteLockTimeout();
      this.startNewVoteLockTimeout = setTimeout(() => {
        this.isStartNewVoteLocked = false;
        this.startNewVoteLockTimeout = null;
      }, App.NEW_ROUND_REVEAL_DELAY_MS);
    }

    if (!isRevealed) {
      this.clearStartNewVoteLock();
    }

    this.previousRoundId = roundId;
    this.previousRoundRevealed = isRevealed;
  }

  private clearStartNewVoteLock(): void {
    this.clearStartNewVoteLockTimeout();
    this.isStartNewVoteLocked = false;
  }

  private clearStartNewVoteLockTimeout(): void {
    if (this.startNewVoteLockTimeout !== null) {
      clearTimeout(this.startNewVoteLockTimeout);
      this.startNewVoteLockTimeout = null;
    }
  }

  private showCinemaFruitEffect(envelope: CinemaLogoActivatedEnvelope): void {
    const effect = envelope.fruitEffect;
    if (!effect) {
      return;
    }

    const target = document.getElementById(`participant-${effect.participantId}`);
    const logo = document.querySelector<HTMLElement>('.cinema-logo-button');
    if (!target || !logo) {
      return;
    }

    this.clearCinemaFruitEffect();
    const targetBounds = target.getBoundingClientRect();
    const logoBounds = logo.getBoundingClientRect();
    const targetX = targetBounds.left + (targetBounds.width / 2);
    const targetY = targetBounds.top + (targetBounds.height / 2);
    const startX = logoBounds.left + (logoBounds.width / 2);
    const startY = logoBounds.top + (logoBounds.height / 2);

    this.cinemaFruitEffect = effect;
    this.cinemaFruitEffectIsExploding = false;
    this.cinemaFruitStartX = `${startX}px`;
    this.cinemaFruitStartY = `${startY}px`;
    this.cinemaFruitTargetX = `${targetX}px`;
    this.cinemaFruitTargetY = `${targetY}px`;

    this.cinemaFruitExplosionTimeout = setTimeout(() => {
      this.cinemaFruitEffectIsExploding = true;
      this.cinemaFruitExplosionTimeout = null;
    }, 650);
    this.cinemaFruitCleanupTimeout = setTimeout(() => {
      this.clearCinemaFruitEffect();
    }, 1000);
  }

  private clearCinemaFruitEffect(): void {
    if (this.cinemaFruitExplosionTimeout !== null) {
      clearTimeout(this.cinemaFruitExplosionTimeout);
      this.cinemaFruitExplosionTimeout = null;
    }

    if (this.cinemaFruitCleanupTimeout !== null) {
      clearTimeout(this.cinemaFruitCleanupTimeout);
      this.cinemaFruitCleanupTimeout = null;
    }

    this.cinemaFruitEffect = null;
    this.cinemaFruitEffectIsExploding = false;
  }
}
