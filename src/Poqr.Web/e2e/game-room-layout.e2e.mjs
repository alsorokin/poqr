export const name = 'game room layout';

async function createSession(browser, frontendUrl) {
  const page = await browser.newPage();
  await page.setViewport({ width: 320, height: 800, deviceScaleFactor: 1 });
  await page.goto(frontendUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('#participant-name').fill('Alice');
  await page.locator('.create-path button').click();
  await page.waitForSelector('.room-header');
  return page;
}

async function expectNarrowHeaderLayout(page) {
  const layout = await page.evaluate(() => {
    const header = document.querySelector('.room-header');
    const logo = document.querySelector('.cinema-logo-button');
    const session = document.querySelector('.room-session');
    const leave = document.querySelector('.room-header .ghost');
    const copy = document.querySelector('.copy-session-link');

    if (!header || !logo || !session || !leave || !copy) {
      throw new Error('Expected all compact room header controls.');
    }

    const bounds = (element) => element.getBoundingClientRect();
    const headerBounds = bounds(header);
    const controlBounds = [bounds(logo), bounds(session), bounds(leave)];
    const centers = controlBounds.map((control) => control.top + (control.height / 2));

    return {
      copyLabel: copy.getAttribute('aria-label'),
      hasShareLink: Boolean(header.querySelector('a')),
      isContained: controlBounds.every((control) =>
        control.left >= headerBounds.left
        && control.right <= headerBounds.right
        && control.top >= headerBounds.top
        && control.bottom <= headerBounds.bottom
      ),
      isVerticallyAligned: Math.max(...centers) - Math.min(...centers) < 2,
      sessionText: session.textContent,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });

  if (layout.copyLabel !== 'Copy session link' || layout.hasShareLink) {
    throw new Error('Expected the share URL to be replaced by an accessible copy control.');
  }

  if (!layout.isContained || !layout.isVerticallyAligned || layout.hasHorizontalOverflow) {
    throw new Error('Expected room-header controls to remain aligned and contained at a narrow width.');
  }

  if (!layout.sessionText.includes('Session')) {
    throw new Error('Expected the session identifier to remain visible.');
  }
}

async function expectUnwrappedJoker(page) {
  await page.locator('.voting button').click();
  await page.waitForSelector('.cards .joker-card');

  const joker = await page.evaluate(() => {
    const card = document.querySelector('.cards .joker-card');
    if (!card) {
      throw new Error('Expected the Joker card.');
    }

    const styles = getComputedStyle(card);
    return {
      label: card.textContent.trim(),
      whiteSpace: styles.whiteSpace,
      isContained: card.scrollWidth <= card.clientWidth
    };
  });

  if (joker.label !== '✋🗿🤚' || joker.whiteSpace !== 'nowrap' || !joker.isContained) {
    throw new Error('Expected the complete Joker mark to remain unwrapped within its card.');
  }
}

export async function run({ browser, frontendUrl }) {
  const page = await createSession(browser, frontendUrl);
  await expectNarrowHeaderLayout(page);
  await expectUnwrappedJoker(page);
}
