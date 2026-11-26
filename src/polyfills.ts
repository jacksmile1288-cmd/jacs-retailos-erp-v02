import { Buffer } from 'buffer';

type GlobalPolyfillTarget = Record<string, unknown> & {
  global?: unknown;
  Buffer?: typeof Buffer;
  process?: {
    browser?: boolean;
    version?: string;
    versions?: Record<string, string>;
    env?: Record<string, string | undefined>;
    nextTick?: (cb: (...args: unknown[]) => void, ...args: unknown[]) => void;
  };
};

function applyBrowserNodePolyfills(target: GlobalPolyfillTarget) {
  if (!target.global) {
    target.global = target;
  }
  if (!target.Buffer) {
    target.Buffer = Buffer;
  }

  const existingProcess = target.process && typeof target.process === 'object' ? target.process : {};
  target.process = {
    ...existingProcess,
    browser: true,
    version: typeof existingProcess.version === 'string' && existingProcess.version ? existingProcess.version : 'v18.0.0',
    versions: existingProcess.versions || {},
    env: existingProcess.env || {},
    nextTick:
      typeof existingProcess.nextTick === 'function'
        ? existingProcess.nextTick
        : (cb: (...args: unknown[]) => void, ...args: unknown[]) => {
            Promise.resolve().then(() => cb(...args));
          },
  };
}

if (typeof globalThis !== 'undefined') {
  applyBrowserNodePolyfills(globalThis as unknown as GlobalPolyfillTarget);
}
if (typeof window !== 'undefined') {
  applyBrowserNodePolyfills(window as unknown as GlobalPolyfillTarget);
}
