import { HttpClient } from '@angular/common/http';
import { PokerClientService } from './poker-client.service';

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
    const received: void[] = [];
    service.cinemaLogoActivated$.subscribe(() => received.push(undefined));

    (service as unknown as { notifyCinemaLogoActivated(): void }).notifyCinemaLogoActivated();
    (service as unknown as { notifyCinemaLogoActivated(): void }).notifyCinemaLogoActivated();

    expect(received).toHaveSize(2);
  });
});
