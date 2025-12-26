import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  timeout: 60000,
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'sendbird-api-tests',
      testMatch: '**/*-api.spec.ts',
    },
  ],
});
