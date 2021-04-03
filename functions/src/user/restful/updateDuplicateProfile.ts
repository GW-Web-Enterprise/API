import { firestore } from 'firebase-admin';
import { https, region } from 'firebase-functions';

/** Called immediately from client when the user signups via the traditional flow */
export const updateDuplicateProfile = region('asia-southeast2').https.onCall(async (data, ctx) => {
    const user = ctx.auth;
    if (!user) throw new https.HttpsError('unauthenticated', 'You are not logged in!');
    const { displayName, photoURL = null } = data;
    if (!displayName) throw new https.HttpsError('invalid-argument', 'You must provide a name');
    const snapshot = await firestore().collection('faculties').get();
    snapshot.docs.forEach(({ ref }) => ref.collection('sysusers').doc(user.uid).update({ photoURL, displayName }));
});
