import { storage } from 'firebase-admin';
import { https, region } from 'firebase-functions';

export const deleteFile = region('asia-southeast2').https.onCall((data, ctx) => {
    const user = ctx.auth;
    if (!user) throw new https.HttpsError('unauthenticated', 'You are not logged in!');
    const { facultyId, repoId, filename } = data;
    if (!facultyId || !repoId || !filename)
        throw new https.HttpsError('invalid-argument', 'One of the required fields is empty');
    const bucket = storage().bucket();
    const file = bucket.file(`faculty_${facultyId}/repo_${repoId}/dropbox_${user.uid}/${filename}`);
    return file
        .delete()
        .then(() => null) // Must return null or client will get err {"severity":"ERROR","message":"Data cannot be encoded in JSON. Infinity"}
        .catch(console.error);
});
