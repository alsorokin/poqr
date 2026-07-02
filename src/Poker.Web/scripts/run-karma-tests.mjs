import { spawn } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer';

const forwardedArgs = process.argv.slice(2);
const hasWatchArg = forwardedArgs.some((arg) => arg === '--watch' || arg.startsWith('--watch='));
const hasBrowsersArg = forwardedArgs.some((arg) => arg.startsWith('--browsers'));

const defaultArgs = [];
if (!hasWatchArg) {
  defaultArgs.push('--watch=false');
}
if (!hasBrowsersArg) {
  defaultArgs.push('--browsers=ChromeHeadless');
}

const ngArgs = ['ng', 'test', ...defaultArgs, ...forwardedArgs];
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npxCommand, ngArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    CHROME_BIN: process.env.CHROME_BIN || puppeteer.executablePath(),
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
