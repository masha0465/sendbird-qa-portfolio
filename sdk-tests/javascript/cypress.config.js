const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: null,
    defaultCommandTimeout: 30000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,
    screenshotOnRunFailure: true,
    video: true,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: false,  // 이 줄 변경!
  },
  env: {
    SENDBIRD_APP_ID: '9768ADB2-F388-42DD-95EB-0B4AB2AD0117',
  },
});