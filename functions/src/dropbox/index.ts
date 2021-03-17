/* eslint-disable import/no-unresolved */
import { aggregateDropboxSize } from '@app/dropbox/aggregateDropboxSize';
import { storage } from 'firebase-admin';
import { https, region } from 'firebase-functions';

export const renameFile = region('asia-southeast2').https.onCall((data, ctx) => {
    const user = ctx.auth;
    if (!user) throw new https.HttpsError('unauthenticated', 'You are not logged in!');
    const {
        newName,
        path: { facultyId, repoId, currentName }
    } = data;
    if (newName === currentName)
        throw new https.HttpsError('invalid-argument', 'New filename is exactly the same as the current filename');
    const dropbox = `faculty_${facultyId}/repo_${repoId}/dropbox_${user.uid}`;
    // The SDK automatically authenticates the local emulator suite with Google Cloud Storage
    // and selects the default bucket 'gw-enterprise.appspot.com'. So u don't have to do anything
    const bucket = storage().bucket();
    async function main() {
        await bucket.file(`${dropbox}/${currentName}`).rename(`${dropbox}/${newName}`);
        await bucket.file(`${dropbox}/${newName}`).setMetadata({
            // For .pdf files, Cloud Storage rejects the 'inline' but accepts 'attachment' attribute
            // If u try to use the 'inline' attribute for .pdf files, the contentDispotition will be ignored
            contentDisposition: `attachment; filename*=utf-8''${encodeURIComponent(newName)}`,
            metaData: {
                modified: new Date().toISOString()
            }
        });
    }
    return main().catch(err => {
        console.error(err);
        if (err.code === 404) throw new https.HttpsError('not-found', 'The file you want to rename does not exist');
    });
});

// Renaming a file will first create a new file with a new name -> triggers .onFinalize()
// and then delete the old one -> triggeres .onDelete()
export const onDropboxFileUpload = region('asia-southeast2')
    .storage.object()
    .onFinalize(object => aggregateDropboxSize(object, 'upload'));

export const onDropboxFileDelete = region('asia-southeast2')
    .storage.object()
    .onDelete(object => aggregateDropboxSize(object, 'delete'));
