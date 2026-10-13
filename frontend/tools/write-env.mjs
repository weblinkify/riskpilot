#!/usr/bin/env node
// Writes public/env.js from API_MODE / API_BASE_URL (defaults: mock, same origin).
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiMode = process.env.API_MODE === 'real' ? 'real' : 'mock';
const apiBaseUrl = process.env.API_BASE_URL ?? '';
const target = resolve(dirname(fileURLToPath(import.meta.url)), '../public/env.js');
writeFileSync(target, `window.__RISKPILOT_ENV__ = ${JSON.stringify({ apiMode, apiBaseUrl })};\n`);
console.log(`env.js → apiMode=${apiMode}${apiBaseUrl ? `, apiBaseUrl=${apiBaseUrl}` : ''}`);
