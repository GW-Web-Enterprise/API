/* eslint-disable import/no-unresolved */
import { ADMIN_EMAIL } from '@app/constants';
import { auth } from 'firebase-admin';
import { https, region } from 'firebase-functions';

export const getUsers = region('asia-southeast2').https.onCall(async (_data, ctx) => {
    const user = ctx.auth;
    if (!user) throw new https.HttpsError('unauthenticated', 'You are not logged in!');
    if (!user.token.isAdmin && user.token.email !== ADMIN_EMAIL)
        throw new https.HttpsError('permission-denied', 'You are not allowed to view a list of sysusrs');
    const { users } = await auth().listUsers();
    return {
        users: users.map(({ uid, email, displayName, photoURL, customClaims }) => ({
            uid,
            email,
            displayName,
            photoURL,
            customClaims
        }))
    };
});
