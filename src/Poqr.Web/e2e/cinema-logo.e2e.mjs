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

async function expectNoFruitEffect(page) {
  try {
    await page.waitForSelector('.cinema-fruit-effect', { timeout: 1000 });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      return;
    }

    throw error;
  }

  throw new Error('Expected no fruit effect.');
}

async function expectFruitStartsAtLogo(page) {
  const positions = await page.evaluate(() => {
    const logo = document.querySelector('.cinema-logo-button');
    const fruit = document.querySelector('.cinema-fruit-effect');
    if (!logo || !fruit) {
      throw new Error('Expected a cinema logo and fruit effect.');
    }

    const logoBounds = logo.getBoundingClientRect();
    const fruitStyles = getComputedStyle(fruit);
    return {
      expectedX: logoBounds.left + (logoBounds.width / 2),
      expectedY: logoBounds.top + (logoBounds.height / 2),
      actualX: Number.parseFloat(fruitStyles.getPropertyValue('--fruit-start-x')),
      actualY: Number.parseFloat(fruitStyles.getPropertyValue('--fruit-start-y'))
    };
  });

  if (positions.actualX !== positions.expectedX || positions.actualY !== positions.expectedY) {
    throw new Error('Expected the fruit to start at the cinema logo.');
  }
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
  await second.waitForSelector('.cinema-fruit-effect[data-fruit-target]');
  await expectFruitStartsAtLogo(second);

  await second.waitForSelector('.cinema-fruit-effect', { hidden: true });
  await clickWithCdp(first, '.cards button');
  await clickWithCdp(second, '.cards button');
  await wait(250);
  await expectLogoActivation(clickWithCdp, first, second, 4);
  await expectNoFruitEffect(second);

  await clickWithCdp(first, '.actions-row button');
  await first.waitForSelector('.voting p strong');
  await expectLogoActivation(clickWithCdp, first, second, 5);
  await expectNoFruitEffect(second);

  await second.reload({ waitUntil: 'domcontentloaded' });
  await second.locator('#participant-name').fill('Bob');
  await second.locator('#session-code').fill(sessionId);
  await second.locator('.join-path button').click();
  await second.waitForSelector('.room-logo[data-animation-key="0"]');
  await wait(250);

  await expectLogoActivation(clickWithCdp, first, second, 1);
}
