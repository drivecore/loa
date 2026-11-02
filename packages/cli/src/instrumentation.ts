import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry for error tracking and logging.
 * This should be imported early in the application lifecycle, before any other code runs.
 */
Sentry.init({
  dsn: 'https://47f674a1332dad00b972d04e82a7cb10@o4508898407481344.ingest.us.sentry.io/4510756088643584',

  // Send structured logs to Sentry
  enableLogs: true,

  // Send console.log, console.warn, and console.error calls as logs to Sentry
  integrations: [Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })],

  // Set environment based on NODE_ENV
  environment: process.env.NODE_ENV || 'development',
});
