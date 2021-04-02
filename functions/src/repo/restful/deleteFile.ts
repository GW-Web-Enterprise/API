/* eslint-disable import/no-unresolved */
import { validateFileWrite } from '@app/utils/validateFileWrite';
import { storage } from 'firebase-admin';
import { https, region } from 'firebase-functions';

export const deleteFile = region('asia-southeast2').https.onCall(async (data, ctx) => {
    const user = ctx.auth;
    if (!user) throw new https.HttpsError('unauthenticated', 'You are not logged in!');
    const { facultyId, repoId, filename } = data;
    if (!facultyId || !repoId || !filename)
        throw new https.HttpsError('invalid-argument', 'One of the required fields is empty');
    await validateFileWrite({ facultyId, repoId, userId: user.uid });
    const bucket = storage().bucket();
    const file = bucket.file(`faculty_${facultyId}/repo_${repoId}/dropbox_${user.uid}/${filename}`);
    await file.delete().catch(err => {
        if (err.code === 404) throw new https.HttpsError('not-found', 'The file you want to delete does not exist');
        console.error(err);
    });
    return null; // Must return null or client will get err {"severity":"ERROR","message":"Data cannot be encoded in JSON. Infinity"}
});
