import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { App } from './app';
import { PokerClientService } from './poker-client.service';
import { CinemaLogoActivatedEnvelope, RoomState, SessionJoinResponse } from './poker.types';

describe('App', () => {
  let pokerClient: jasmine.SpyObj<PokerClientService> & {
    state$: Subject<RoomState>;
    error$: Subject<string>;
    sessionClosed$: Subject<string>;
    cinemaLogoActivated$: Subject<CinemaLogoActivatedEnvelope>;
  };

  const buildRoomState = (overrides?: Partial<RoomState>): RoomState => ({
    sessionId: 'ABC123',
    participants: [
      { participantId: 'p1', name: 'Alice', isConnected: true },
      { participantId: 'p2', name: 'Bob', isConnected: true }
    ],
    currentRound: {
      roundId: 'r1',
      isRevealed: false,
      votedParticipantIds: [],
      revealedVotes: null,
      average: null
    },
    cardValues: ['1', '2', '3', 'Joker'],
    ...overrides
  });

  const buildJoinResponse = (overrides?: Partial<SessionJoinResponse>): SessionJoinResponse => ({
    sessionId: 'ABC123',
    participantId: 'p1',
    state: buildRoomState(),
    ...overrides
  });

  beforeEach(async () => {
    pokerClient = jasmine.createSpyObj<PokerClientService>(
      'PokerClientService',
      ['createSession', 'joinSession', 'connect', 'startRound', 'castVote', 'revealRound', 'activateCinemaLogo', 'leaveSession'],
      {
        state$: new Subject<RoomState>(),
        error$: new Subject<string>(),
        sessionClosed$: new Subject<string>(),
        cinemaLogoActivated$: new Subject<CinemaLogoActivatedEnvelope>()
      }
    ) as jasmine.SpyObj<PokerClientService> & {
      state$: Subject<RoomState>;
      error$: Subject<string>;
      sessionClosed$: Subject<string>;
      cinemaLogoActivated$: Subject<CinemaLogoActivatedEnvelope>;
    };

    pokerClient.connect.and.resolveTo();
    pokerClient.startRound.and.resolveTo();
    pokerClient.castVote.and.resolveTo();
    pokerClient.revealRound.and.resolveTo();
    pokerClient.activateCinemaLogo.and.resolveTo();
    pokerClient.leaveSession.and.resolveTo();

    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState({}, '', '/');

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: PokerClientService, useValue: pokerClient }]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render heading', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Poqr');
  });

  it('renders the tilted accessible cinema logo on the landing page', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const logo = compiled.querySelector<HTMLElement>('.landing-logo');

    expect(logo?.getAttribute('aria-label')).toBe('Pure cinema');
    expect(logo?.textContent).toContain('✋🗿✋');
    expect(logo?.querySelector('.brand-hand--mirrored')).not.toBeNull();
  });

  it('renders mirrored accessible create and join session paths with their existing disabled states', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const createButton = compiled.querySelector<HTMLButtonElement>('.create-path button');
    const joinButton = compiled.querySelector<HTMLButtonElement>('.join-path button');
    const participantNameInput = compiled.querySelector<HTMLInputElement>('#participant-name');
    const sessionCodeInput = compiled.querySelector<HTMLInputElement>('#session-code');

    expect(compiled.querySelector('.session-entry')).not.toBeNull();
    expect(compiled.querySelector('.session-divider')?.textContent).toContain('or join an existing session');
    expect(compiled.querySelector('.create-path h2')?.textContent).toContain('Start a new session');
    expect(compiled.querySelector('.join-path h2')?.textContent).toContain('Join an existing session');
    expect(createButton?.textContent).toContain('Create');
    expect(joinButton?.textContent).toContain('Join');
    expect(participantNameInput?.placeholder).toBe('Your name');
    expect(sessionCodeInput?.placeholder).toBe('Session code');
    expect(compiled.querySelector('label[for="participant-name"]')?.classList).toContain('visually-hidden');
    expect(compiled.querySelector('label[for="session-code"]')?.classList).toContain('visually-hidden');
    expect(createButton?.disabled).toBeTrue();
    expect(joinButton?.disabled).toBeTrue();

    app.participantName = 'Alice';
    app.sessionInput = 'ABC123';
    fixture.detectChanges();

    expect(createButton?.disabled).toBeFalse();
    expect(joinButton?.disabled).toBeFalse();
  });

  it('reads session query parameter on init', () => {
    window.history.replaceState({}, '', '/?session=abc123');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.componentInstance.sessionInput).toBe('ABC123');
  });

  it('restores the last participant name on init', () => {
    localStorage.setItem('poker.participantName', 'Alice');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.componentInstance.participantName).toBe('Alice');
  });

  it('creates a session and connects to realtime updates', async () => {
    const response = buildJoinResponse();
    pokerClient.createSession.and.returnValue(of(response));

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.participantName = 'Alice';

    app.createSession();
    await fixture.whenStable();

    expect(pokerClient.createSession).toHaveBeenCalledWith('Alice');
    expect(pokerClient.connect).toHaveBeenCalledWith('ABC123', 'p1');
    expect(app.sessionId).toBe('ABC123');
    expect(app.participantId).toBe('p1');
    expect(localStorage.getItem('poker.participantName')).toBe('Alice');
    expect(sessionStorage.getItem('poker.participant.ABC123')).toBe('p1');
    expect(new URL(window.location.href).searchParams.get('session')).toBe('ABC123');
  });

  it('joins session with remembered participant id', () => {
    const response = buildJoinResponse();
    pokerClient.joinSession.and.returnValue(of(response));
    sessionStorage.setItem('poker.participant.ABC123', 'remembered-p1');

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.participantName = 'Alice';
    app.sessionInput = 'abc123';

    app.joinSession();

    expect(pokerClient.joinSession).toHaveBeenCalledWith('abc123', 'Alice', 'remembered-p1');
  });

  it('does not vote when round is revealed', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.sessionId = 'ABC123';
    app.participantId = 'p1';
    app.roomState = buildRoomState({
      currentRound: {
        roundId: 'r1',
        isRevealed: true,
        votedParticipantIds: [],
        revealedVotes: null,
        average: 5
      }
    });

    await app.vote('3');

    expect(pokerClient.castVote).not.toHaveBeenCalled();
  });

  it('casts vote and updates selected card when voting is allowed', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.sessionId = 'ABC123';
    app.participantId = 'p1';
    app.roomState = buildRoomState();

    await app.vote('3');

    expect(app.selectedCard).toBe('3');
    expect(pokerClient.castVote).toHaveBeenCalledWith('ABC123', 'p1', 'r1', '3');
  });

  it('clears selected card when a new round starts from state updates', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    app.roomState = buildRoomState({
      currentRound: {
        roundId: 'r1',
        isRevealed: true,
        votedParticipantIds: ['p1'],
        revealedVotes: { p1: '3' },
        average: 3
      }
    });
    app.selectedCard = '3';

    pokerClient.state$.next(buildRoomState({
      currentRound: {
        roundId: 'r2',
        isRevealed: false,
        votedParticipantIds: [],
        revealedVotes: null,
        average: null
      }
    }));

    expect(app.selectedCard).toBeNull();
  });

  it('reveal shows card labels and fallback values', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.roomState = buildRoomState({
      currentRound: {
        roundId: 'r1',
        isRevealed: true,
        votedParticipantIds: ['p1'],
        revealedVotes: { p1: 'Joker' },
        average: null
      }
    });

    expect(app.revealedVote('p1')).toBe('✋🗿🤚');
    expect(app.revealedVote('p2')).toBe('—');
  });

  it('resets room when session closed event is received', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    app.sessionId = 'ABC123';
    app.participantId = 'p1';
    app.roomState = buildRoomState();
    app.selectedCard = '5';

    pokerClient.sessionClosed$.next('Session was closed by host.');

    expect(app.error).toBe('Session was closed by host.');
    expect(app.sessionId).toBeNull();
    expect(app.participantId).toBeNull();
    expect(app.roomState).toBeNull();
    expect(app.selectedCard).toBeNull();
  });

  it('leaves active room and clears local state', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.sessionId = 'ABC123';
    app.participantId = 'p1';
    app.roomState = buildRoomState();

    await app.leave();

    expect(pokerClient.leaveSession).toHaveBeenCalledWith('ABC123', 'p1');
    expect(app.sessionId).toBeNull();
    expect(app.participantId).toBeNull();
    expect(app.roomState).toBeNull();
  });

  it('activates the room cinema logo and restarts it for each received event', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.sessionId = 'ABC123';
    app.participantId = 'p1';
    app.roomState = buildRoomState();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const logoButton = compiled.querySelector<HTMLButtonElement>('.cinema-logo-button');
    expect(logoButton?.getAttribute('aria-label')).toBe('Pure cinema');
    expect(logoButton?.querySelector('.brand-hand--mirrored')).not.toBeNull();

    logoButton?.click();
    await fixture.whenStable();
    expect(pokerClient.activateCinemaLogo).toHaveBeenCalled();

    pokerClient.cinemaLogoActivated$.next({ fruitEffect: null });
    pokerClient.cinemaLogoActivated$.next({ fruitEffect: null });
    expect(app.cinemaLogoAnimationKey).toBe(2);
  });

  it('shows a fruit effect for an eligible target and removes it after the explosion', () => {
    jasmine.clock().install();

    try {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      app.sessionId = 'ABC123';
      app.participantId = 'p1';
      app.roomState = buildRoomState();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const logo = compiled.querySelector<HTMLElement>('.cinema-logo-button');
      const target = compiled.querySelector<HTMLElement>('#participant-p2');
      spyOn(logo!, 'getBoundingClientRect').and.returnValue(new DOMRect(20, 30, 40, 50));
      spyOn(target!, 'getBoundingClientRect').and.returnValue(new DOMRect(100, 120, 60, 70));

      pokerClient.cinemaLogoActivated$.next({
        fruitEffect: { participantId: 'p2', fruit: '🍓' }
      });
      fixture.detectChanges();

      expect(app.cinemaFruitEffect?.participantId).toBe('p2');
      expect(app.cinemaFruitStartX).toBe('40px');
      expect(app.cinemaFruitStartY).toBe('55px');
      expect(app.cinemaFruitTargetX).toBe('130px');
      expect(app.cinemaFruitTargetY).toBe('155px');
      expect(fixture.nativeElement.querySelector('.cinema-fruit-effect')?.textContent).toContain('🍓');

      jasmine.clock().tick(650);
      fixture.detectChanges();
      expect(app.cinemaFruitEffectIsExploding).toBeTrue();
      expect(fixture.nativeElement.querySelector('.cinema-fruit-effect')?.textContent).toContain('💥');

      jasmine.clock().tick(350);
      expect(app.cinemaFruitEffect).toBeNull();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('locks starting a new vote for 5 seconds right after reveal', async () => {
    jasmine.clock().install();

    try {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      fixture.detectChanges();

      app.sessionId = 'ABC123';
      app.participantId = 'p1';

      pokerClient.state$.next(buildRoomState({
        currentRound: {
          roundId: 'r1',
          isRevealed: false,
          votedParticipantIds: ['p1'],
          revealedVotes: null,
          average: null
        }
      }));

      pokerClient.state$.next(buildRoomState({
        currentRound: {
          roundId: 'r1',
          isRevealed: true,
          votedParticipantIds: ['p1'],
          revealedVotes: { p1: '3' },
          average: 3
        }
      }));

      expect(app.canStartNewVote).toBeFalse();

      await app.startRound();
      expect(pokerClient.startRound).not.toHaveBeenCalled();

      jasmine.clock().tick(5000);

      expect(app.canStartNewVote).toBeTrue();

      await app.startRound();
      expect(pokerClient.startRound).toHaveBeenCalledWith('ABC123', 'p1');
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
