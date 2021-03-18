/* eslint-disable import/no-unresolved */
import 'module-alias/register';
import admin from 'firebase-admin';

// Environment variables are automatically populated in the functions runtime and in locally emulated functions.
// These include those populated by Google Cloud (https://cloud.google.com/functions/docs/env-var#runtime_environment_variables_set_automatically),
// as well as a Firebase-specific process.env.FIREBASE_CONFIG.
// The envs mentioned above are applied automatically when you initialize the Admin SDK with no arguments like below
admin.initializeApp();

export * from '@app/user';
export * from '@app/faculty';
export * from '@app/repo';
