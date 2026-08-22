import { HttpClient } from '@angular/common/http';
import { PokerClientService } from './poker-client.service';
import { CinemaLogoActivatedEnvelope } from './poker.types';

describe('PokerClientService', () => {
  it('invokes the additive cinema logo hub method', async () => {
    const service = new PokerClientService({} as HttpClient);
    const invoke = jasmine.createSpy('invoke').and.resolveTo();

    (service as unknown as { hub: { invoke: jasmine.Spy } }).hub = { invoke };

    await service.activateCinemaLogo();

    expect(invoke).toHaveBeenCalledWith('ActivateCinemaLogo');
  });

  it('emits each received cinema logo activation', () => {
    const service = new PokerClientService({} as HttpClient);
    const received: CinemaLogoActivatedEnvelope[] = [];
    service.cinemaLogoActivated$.subscribe((envelope) => received.push(envelope));

    const notify = service as unknown as {
      notifyCinemaLogoActivated(envelope: CinemaLogoActivatedEnvelope): void;
    };
    notify.notifyCinemaLogoActivated({ fruitEffect: null });
    notify.notifyCinemaLogoActivated({
      fruitEffect: { participantId: 'p1', fruit: '🍎' }
    });

    expect(received).toHaveSize(2);
    expect(received[0].fruitEffect).toBeNull();
    expect(received[1].fruitEffect?.fruit).toBe('🍎');
  });
});
