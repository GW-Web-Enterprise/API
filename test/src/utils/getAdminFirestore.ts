import 'module-alias/register';
import { PROJECT_ID } from '@app/constants';
import { initializeAdminApp } from '@firebase/rules-unit-testing';

// This is NOT an actual server-side admin SDK, it's just a special version of client sdk that bypasses Sec Rules
// only for unit testing purposes
export const getAdminFirestore = () => initializeAdminApp({ projectId: PROJECT_ID }).firestore();
