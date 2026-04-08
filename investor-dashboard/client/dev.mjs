#!/usr/bin/env node
// Dev launcher: changes cwd to client dir so vite.config.js resolves correctly
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { chdir } from 'process';

const __dirname = dirname(fileURLToPath(import.meta.url));
chdir(__dirname);

// Import vite after chdir so config resolution works
const { createServer } = await import('vite');
const server = await createServer();
await server.listen();
server.printUrls();
