/* eslint-disable import/no-unresolved */
import 'module-alias/register';
import admin from 'firebase-admin';

admin.initializeApp();

export * from '@app/faculty';
export * from '@app/dropbox';
