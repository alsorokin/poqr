import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiRoot = path.resolve(webRoot, '..', 'Poqr.Api');
const scenariosRoot = path.resolve(webRoot, 'e2e');
const backendUrl = 'http://localhost:5057';
const startedProcesses = [];
const maxDiagnostics = 50;

async function assertPortAvailable(port) {
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', () => reject(new Error(`Port ${port} is already in use.`)));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}

function startProcess(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  const appendOutput = (data) => {
    output = `${output}${data}`.slice(-4000);
  };

  child.stdout.on('data', appendOutput);
  child.stderr.on('data', appendOutput);
  startedProcesses.push({ child, output: () => output });
  return child;
}

async function waitForResponse(url) {
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`Timed out waiting for ${url}.`);
}

async function stopProcesses() {
  await Promise.all(startedProcesses.map(async ({ child }) => {
    if (child.exitCode !== null) {
      return;
    }

    child.kill('SIGTERM');
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        resolve();
      }, 5000);
      child.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }));
}

async function clickWithCdp(page, selector) {
  const session = await page.createCDPSession();
  try {
    const { root } = await session.send('DOM.getDocument');
    const { nodeId } = await session.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector
    });
    if (!nodeId) {
      throw new Error(`Could not find ${selector}.`);
    }

    const { model } = await session.send('DOM.getBoxModel', { nodeId });
    const x = (model.border[0] + model.border[2]) / 2;
    const y = (model.border[1] + model.border[5]) / 2;
    await session.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1
    });
    await session.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1
    });
  } finally {
    await session.detach();
  }
}

async function loadScenarios() {
  const files = await readdir(scenariosRoot);
  const scenarioFiles = files.filter((file) => file.endsWith('.e2e.mjs')).sort();

  if (scenarioFiles.length === 0) {
    throw new Error(`No E2E scenarios found in ${scenariosRoot}.`);
  }

  return Promise.all(scenarioFiles.map(async (file) => {
    const scenario = await import(pathToFileURL(path.join(scenariosRoot, file)).href);
    if (typeof scenario.run !== 'function' || typeof scenario.name !== 'string') {
      throw new Error(`${file} must export a scenario name and run(context) function.`);
    }

    return scenario;
  }));
}

function externalFrontendUrl() {
  const configuredOrigin = process.env.POQR_E2E_ORIGIN;
  if (!configuredOrigin) {
    return null;
  }

  let url;
  try {
    url = new URL(configuredOrigin);
  } catch {
    throw new Error('POQR_E2E_ORIGIN must be a valid HTTPS origin.');
  }

  if (
    url.protocol !== 'https:'
    || url.username
    || url.password
    || url.pathname !== '/'
    || url.search
    || url.hash
  ) {
    throw new Error('POQR_E2E_ORIGIN must be an HTTPS origin without a path, credentials, query, or fragment.');
  }

  return url.origin;
}

function sanitizedUrl(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '[invalid URL]';
  }
}

function parseSignalRFrame(payload) {
  const message = payload.split('\u001e', 1)[0];
  try {
    const parsed = JSON.parse(message);
    return {
      target: parsed.target ?? null,
      description: parsed.target ?? (parsed.type ? `SignalR message type ${parsed.type}` : 'non-JSON payload')
    };
  } catch {
    return { target: null, description: 'non-JSON payload' };
  }
}

function createBrowserObserver(record = () => {}) {
  const observedPages = new WeakSet();
  const pageStates = new WeakMap();

  const observePage = async (page, label) => {
    if (observedPages.has(page)) {
      return;
    }
    observedPages.add(page);
    const state = { receivedTargets: new Set(), waiters: new Map() };
    pageStates.set(page, state);
    const session = await page.createCDPSession();
    await session.send('Network.enable');
    session.on('Network.webSocketCreated', () => record(`${label}: WebSocket created.`));
    session.on('Network.webSocketClosed', () => record(`${label}: WebSocket closed.`));
    session.on('Network.webSocketFrameError', () => record(`${label}: WebSocket frame error.`));
    session.on('Network.webSocketFrameSent', ({ response }) => {
      record(`${label}: WebSocket frame sent: ${parseSignalRFrame(response.payloadData).description}.`);
    });
    session.on('Network.webSocketFrameReceived', ({ response }) => {
      const frame = parseSignalRFrame(response.payloadData);
      record(`${label}: WebSocket frame received: ${frame.description}.`);
      if (frame.target) {
        state.receivedTargets.add(frame.target);
        const waiters = state.waiters.get(frame.target);
        if (waiters) {
          for (const waiter of waiters) {
            waiter();
          }
          state.waiters.delete(frame.target);
        }
      }
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        record(`${label}: Console error: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => record(`${label}: Page error: ${error.message}`));
    page.on('requestfailed', (request) => {
      record(`${label}: Request failed: ${request.method()} ${sanitizedUrl(request.url())} (${request.failure()?.errorText ?? 'unknown error'})`);
    });
  };

  const waitForMessage = async (page, target, timeout, includePast) => {
    const state = pageStates.get(page);
    if (!state) {
      throw new Error(`Page is not being observed for SignalR message ${target}.`);
    }
    if (includePast && state.receivedTargets.has(target)) {
      return;
    }

    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        state.waiters.get(target)?.delete(complete);
        reject(new Error(
          `Timed out waiting for SignalR message ${target}. `
          + `Received message types: ${[...state.receivedTargets].join(', ') || 'none'}`
        ));
      }, timeout);
      const complete = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      const waiters = state.waiters.get(target) ?? new Set();
      waiters.add(complete);
      state.waiters.set(target, waiters);
    });
  };

  return {
    observePage,
    waitForSignalRMessage: (page, target, timeout = 10000) =>
      waitForMessage(page, target, timeout, true),
    waitForNextSignalRMessage: (page, target, timeout = 10000) =>
      waitForMessage(page, target, timeout, false)
  };
}

async function run() {
  const externalUrl = externalFrontendUrl();
  const frontendUrl = externalUrl ?? 'http://localhost:4200';

  if (externalUrl) {
    console.log(`Running E2E scenarios against external origin: ${externalUrl}`);
  } else {
    await Promise.all([assertPortAvailable(4200), assertPortAvailable(5057)]);
    startProcess('dotnet', ['run', '--no-build'], apiRoot);
    startProcess(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['ng', 'serve'], webRoot);
    await Promise.all([waitForResponse(frontendUrl), waitForResponse(backendUrl)]);
  }

  const browser = await puppeteer.launch({ headless: true });
  const diagnostics = [];
  const recordDiagnostic = externalUrl
    ? (message) => {
      if (diagnostics.length < maxDiagnostics) {
        diagnostics.push(message);
      }
    }
    : undefined;
  const browserObserver = createBrowserObserver(recordDiagnostic);
  try {
    const context = {
      browser,
      frontendUrl,
      clickWithCdp,
      observePage: browserObserver.observePage,
      waitForSignalRMessage: browserObserver.waitForSignalRMessage,
      waitForNextSignalRMessage: browserObserver.waitForNextSignalRMessage
    };
    for (const scenario of await loadScenarios()) {
      console.log(`Running E2E scenario: ${scenario.name}`);
      await scenario.run(context);
    }
  } catch (error) {
    if (diagnostics.length > 0) {
      error.message = `${error.message}\n\nExternal browser diagnostics:\n${diagnostics.join('\n')}`;
    }
    throw error;
  } finally {
    await browser.close();
  }
}

try {
  await run();
  console.log('E2E scenarios passed.');
} catch (error) {
  const processOutput = startedProcesses
    .map(({ output }) => output())
    .filter(Boolean)
    .join('\n');
  console.error(error);
  if (processOutput) {
    console.error(`\nServer output:\n${processOutput}`);
  }
  process.exitCode = 1;
} finally {
  await stopProcesses();
}
