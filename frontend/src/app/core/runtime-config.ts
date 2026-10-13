export type ApiMode = 'mock' | 'real';

export interface RuntimeConfig {
  apiMode: ApiMode;
  /** Base URL of the Java backend in real mode. Empty = same origin (nginx / dev-server proxy). */
  apiBaseUrl: string;
}

declare global {
  interface Window {
    __RISKPILOT_ENV__?: Partial<RuntimeConfig>;
  }
}

/**
 * Read once at startup from `env.js`, which is generated from the API_MODE / API_BASE_URL
 * environment variables (at build time by tools/write-env.mjs, at container start by the nginx image).
 */
export function readRuntimeConfig(): RuntimeConfig {
  const env = (typeof window !== 'undefined' && window.__RISKPILOT_ENV__) || {};
  return {
    apiMode: env.apiMode === 'real' ? 'real' : 'mock',
    apiBaseUrl: (env.apiBaseUrl ?? '').replace(/\/$/, ''),
  };
}

export const runtimeConfig = readRuntimeConfig();
