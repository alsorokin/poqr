export const name = 'cinema logo';

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function createOrJoinSession(browser, frontendUrl, name, sessionId) {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(sessionId ? `${frontendUrl}/?session=${sessionId}` : frontendUrl, {
    waitUntil: 'domcontentloaded'
  });

  await page.locator('#participant-name').fill(name);
  if (sessionId) {
    await page.locator('#session-code').fill(sessionId);
    await page.locator('.join-path button').click();
  } else {
    await page.locator('.create-path button').click();
  }

  await page.waitForSelector('.cinema-logo-button');
  return page;
}

async function expectLogoActivation(clickWithCdp, source, recipient, animationKey) {
  await clickWithCdp(source, '.cinema-logo-button');
  await recipient.waitForSelector(`.room-logo[data-animation-key="${animationKey}"]`, { timeout: 10000 });
}

export async function run({ browser, frontendUrl, clickWithCdp }) {
  const first = await createOrJoinSession(browser, frontendUrl, 'Alice');
  const sessionId = new URL(first.url()).searchParams.get('session');
  if (!sessionId) {
    throw new Error('Creating a session did not add a session id to the URL.');
  }

  const second = await createOrJoinSession(browser, frontendUrl, 'Bob', sessionId);
  await wait(250);

  await expectLogoActivation(clickWithCdp, first, second, 1);
  await expectLogoActivation(clickWithCdp, first, second, 2);

  await clickWithCdp(first, '.voting button');
  await first.waitForSelector('.cards');
  await expectLogoActivation(clickWithCdp, first, second, 3);

  await clickWithCdp(first, '.actions-row button');
  await first.waitForSelector('.voting p strong');
  await expectLogoActivation(clickWithCdp, first, second, 4);

  await second.reload({ waitUntil: 'domcontentloaded' });
  await second.locator('#participant-name').fill('Bob');
  await second.locator('#session-code').fill(sessionId);
  await second.locator('.join-path button').click();
  await second.waitForSelector('.room-logo[data-animation-key="0"]');
  await wait(250);

  await expectLogoActivation(clickWithCdp, first, second, 1);
}
