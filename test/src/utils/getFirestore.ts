import 'module-alias/register';
import { PROJECT_ID } from '@app/constants';
import { initializeTestApp } from '@firebase/rules-unit-testing';
import { TokenOptions } from '@firebase/rules-unit-testing/dist/src/api';

// New changes to the local firestore.rules get picked up automatically by the emulator
export const getFirestore = (auth?: TokenOptions) => initializeTestApp({ projectId: PROJECT_ID, auth }).firestore();
