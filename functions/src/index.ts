/* eslint-disable import/no-unresolved */
import 'module-alias/register';
import admin from 'firebase-admin';
import { sync } from 'glob';

// Environment variables are automatically populated in the functions runtime and in locally emulated functions.
// These include those populated by Google Cloud (https://cloud.google.com/functions/docs/env-var#runtime_environment_variables_set_automatically),
// as well as a Firebase-specific process.env.FIREBASE_CONFIG.
// The envs mentioned above are applied automatically when you initialize the Admin SDK with no arguments like below
admin.initializeApp();

// glob.sync returns filenames found matching the pattern
const funcFilePaths = sync(`${process.cwd()}/**/+(reactive|restful)/*.js`, {
    cwd: process.cwd(),
    ignore: './node_modules/**'
});

let exported = {};
funcFilePaths.forEach(path => (exported = { ...exported, ...require(path) }));
export default exported;
