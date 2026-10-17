import { waitForRoomStateUpdate } from './room-readiness.mjs';

export const name = 'invite-focused session entry';

async function expectContainedInvitation(page) {
  const layout = await page.evaluate(() => {
    const panel = document.querySelector('.landing-panel');
    const controls = [
      document.querySelector('.invitation-entry h2'),
      document.querySelector('.invitation-code'),
      document.querySelector('#invitation-participant-name'),
      document.querySelector('.invitation-entry form button'),
      document.querySelector('.invitation-entry .ghost')
    ];
    if (!panel || controls.some((control) => !control)) {
      throw new Error('Expected the invitation heading and all entry controls.');
    }

    const panelBounds = panel.getBoundingClientRect();
    return {
      isContained: controls.every((control) => {
        const bounds = control.getBoundingClientRect();
        return bounds.left >= panelBounds.left
          && bounds.right <= panelBounds.right
          && bounds.top >= panelBounds.top
          && bounds.bottom <= panelBounds.bottom;
      }),
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });

  if (!layout.isContained || layout.hasHorizontalOverflow) {
    throw new Error('Expected invitation controls to remain contained at a narrow viewport.');
  }
}

export async function run({
  browser,
  frontendUrl,
  observePage,
  waitForSignalRMessage,
  waitForNextSignalRMessage
}) {
  const host = await browser.newPage();
  await observePage(host, 'invite-host');
  await host.goto(frontendUrl, { waitUntil: 'domcontentloaded' });
  await host.locator('#participant-name').fill('Host');
  await host.locator('.create-path button').click();
  await host.waitForSelector('.room-header');
  await waitForRoomStateUpdate(waitForSignalRMessage, host);

  const sessionId = new URL(host.url()).searchParams.get('session');
  if (!sessionId) {
    throw new Error('Creating a host session did not add a session id to the URL.');
  }

  const invitee = await browser.newPage();
  await observePage(invitee, 'invitee');
  await invitee.setViewport({ width: 320, height: 800, deviceScaleFactor: 1 });
  let createRequests = 0;
  invitee.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/sessions') {
      createRequests += 1;
    }
  });

  const invitationUrl = new URL(frontendUrl);
  invitationUrl.searchParams.set('session', sessionId);
  invitationUrl.searchParams.set('keep', '1');
  invitationUrl.hash = 'invite';
  await invitee.goto(invitationUrl.toString(), { waitUntil: 'domcontentloaded' });
  await invitee.waitForSelector('.invitation-entry');
  await expectContainedInvitation(invitee);
  await invitee.locator('.invitation-entry .ghost').click();
  await invitee.waitForSelector('.create-path');

  const escapedUrl = new URL(invitee.url());
  if (
    escapedUrl.searchParams.has('session')
    || escapedUrl.searchParams.get('keep') !== '1'
    || escapedUrl.hash !== '#invite'
    || createRequests !== 0
  ) {
    throw new Error('Escaping invitation entry did not preserve the URL or avoid creating a session.');
  }

  await invitee.reload({ waitUntil: 'domcontentloaded' });
  await invitee.waitForSelector('.create-path');
  if (createRequests !== 0) {
    throw new Error('Reloading after escape unexpectedly created a session.');
  }

  await invitee.goto(`${frontendUrl}/?session=${encodeURIComponent(sessionId)}`, {
    waitUntil: 'domcontentloaded'
  });
  const hostRoomUpdate = waitForNextSignalRMessage(host, 'RoomStateUpdated');
  await invitee.locator('#invitation-participant-name').fill('Invitee');
  await invitee.locator('#invitation-participant-name').click();
  await invitee.keyboard.press('Enter');
  await invitee.waitForSelector('.room-header');
  await hostRoomUpdate;
  await host.waitForFunction(
    () => document.querySelector('.participants')?.textContent.includes('Invitee'),
    { timeout: 10000 }
  );
  if (createRequests !== 0) {
    throw new Error('Joining an invitation unexpectedly created a separate session.');
  }

  const failedInvitee = await browser.newPage();
  await observePage(failedInvitee, 'failed-invitee');
  await failedInvitee.setViewport({ width: 320, height: 800, deviceScaleFactor: 1 });
  let failedCreateRequests = 0;
  failedInvitee.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/sessions') {
      failedCreateRequests += 1;
    }
  });
  await failedInvitee.goto(`${frontendUrl}/?session=missing`, { waitUntil: 'domcontentloaded' });
  await failedInvitee.locator('#invitation-participant-name').fill('Retry');
  await failedInvitee.locator('#invitation-participant-name').click();
  await failedInvitee.keyboard.press('Enter');
  await failedInvitee.waitForFunction(
    () => document.querySelector('[role="alert"]')?.textContent.includes('Unable to join'),
    { timeout: 10000 }
  );
  if (
    !(await failedInvitee.$eval('.invitation-code', (element) => element.textContent.includes('MISSING')))
    || failedCreateRequests !== 0
  ) {
    throw new Error('A failed invitation join did not retain its context or created a replacement session.');
  }

  await failedInvitee.locator('.invitation-entry .ghost').click();
  await failedInvitee.waitForSelector('.create-path');
  if (failedCreateRequests !== 0) {
    throw new Error('Escaping a failed invitation unexpectedly created a session.');
  }
}
