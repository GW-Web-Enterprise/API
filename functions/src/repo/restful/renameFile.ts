/* eslint-disable import/no-unresolved */
import 'module-alias/register';
import { validateFileWrite } from '@app/utils/validateFileWrite';
import { storage } from 'firebase-admin';
import { https, region } from 'firebase-functions';

// Renaming a file will first create a new file with a new name -> triggers .onFinalize()
// and then delete the old one -> triggeres .onDelete()
export const renameFile = region('asia-southeast2').https.onCall(async (data, ctx) => {
    const user = ctx.auth;
    if (!user) throw new https.HttpsError('unauthenticated', 'You are not logged in!');
    const {
        newName,
        path: { facultyId, repoId, currentName }
    } = data;
    if (newName === currentName)
        throw new https.HttpsError('invalid-argument', 'New filename is exactly the same as the current filename');
    if (!facultyId || !repoId || !currentName || !newName)
        throw new https.HttpsError('invalid-argument', 'One of the required fields is empty');
    await validateFileWrite({ facultyId, repoId, userId: user.uid, performRename: true });
    const dropbox = `faculty_${facultyId}/repo_${repoId}/dropbox_${user.uid}`;
    const bucket = storage().bucket();
    await bucket
        .file(`${dropbox}/${currentName}`)
        .rename(`${dropbox}/${newName}`)
        .catch(err => {
            console.error(err);
            if (err.code === 404) throw new https.HttpsError('not-found', 'The file you want to rename does not exist');
        });
    await bucket.file(`${dropbox}/${newName}`).setMetadata({
        // For .pdf files, Cloud Storage rejects the 'inline' but accepts 'attachment' attribute
        // If u try to use the 'inline' attribute for .pdf files, the contentDispotition will be ignored
        contentDisposition: `attachment; filename*=utf-8''${encodeURIComponent(newName)}`,
        metaData: {
            modified: new Date().toISOString()
        }
    });
});
