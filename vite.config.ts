import { defineConfig } from 'vitest/config';
import path from 'path';
import os from 'os';
export default defineConfig({
  // Write Vite's dep-optimization cache to the OS temp dir so it works
  // even when the project folder is on a filesystem that blocks file deletion
  // (e.g. macOS APFS mounts inside Docker/sandbox environments).
  cacheDir: path.join(os.tmpdir(), 'vite-cosmo5'),
  build: { target: 'es2022' },
  test: { environment: 'node' },
});
