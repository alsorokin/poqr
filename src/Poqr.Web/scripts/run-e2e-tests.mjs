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
const frontendUrl = 'http://localhost:4200';
const backendUrl = 'http://localhost:5057';
const startedProcesses = [];

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

async function run() {
  await Promise.all([assertPortAvailable(4200), assertPortAvailable(5057)]);
  startProcess('dotnet', ['run', '--no-build'], apiRoot);
  startProcess(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['ng', 'serve'], webRoot);

  await Promise.all([waitForResponse(frontendUrl), waitForResponse(backendUrl)]);

  const browser = await puppeteer.launch({ headless: true });
  try {
    const context = { browser, frontendUrl, clickWithCdp };
    for (const scenario of await loadScenarios()) {
      console.log(`Running E2E scenario: ${scenario.name}`);
      await scenario.run(context);
    }
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
