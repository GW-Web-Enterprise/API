/* eslint-disable import/no-unresolved */
import { ADMIN_EMAIL } from '@app/constants';
import { auth } from 'firebase-admin';
import { https, region } from 'firebase-functions';

export const setRole = region('asia-southeast2').https.onCall((data, ctx) => {
    const user = ctx.auth;
    if (!user) throw new https.HttpsError('unauthenticated', 'You are not logged in!');
    if (!user.token.isAdmin && user.token.email !== ADMIN_EMAIL)
        throw new https.HttpsError('permission-denied', 'You are not allowed to set global role of system user');
    const { isGuest = false, isManager = false, isAdmin = false, uid = '' } = data;
    if (isGuest === isManager)
        throw new https.HttpsError('invalid-argument', 'One must be true and the other must be false');
    return auth().setCustomUserClaims(uid, { isGuest, isManager, isAdmin }).catch(console.error);
});
