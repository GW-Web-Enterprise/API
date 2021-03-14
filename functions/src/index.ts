/* eslint-disable import/no-unresolved */
import 'module-alias/register';
import { region, https } from 'firebase-functions';
import admin from 'firebase-admin';
import { aggregateDropboxSize } from '@app/utils/aggregateDropboxSize';

// Use the Service Account if and only if u want to access Cloud Storage
admin.initializeApp();

export const handleFacultyWrite = region('asia-southeast2')
    .firestore.document('faculties/{facultyId}')
    .onWrite(async change => {
        const db = admin.firestore();
        if (change.before.isEqual(change.after)) return; // this kind of update event changes nothing in the DB
        const batch = db.batch();
        // 📌 Add the faculty name to a collection of unique faculty names so that FireStore Security Rules can check for the uniqueness
        const uniqueNamesRef = db.collection('uniqueFacNames');
        if (change.before.exists && change.after.exists) {
            // when a doc is updated...
            batch.delete(uniqueNamesRef.doc(change.before.data()!.name));
            batch.set(uniqueNamesRef.doc(change.after.data()!.name), {});
            return await batch.commit();
        }
        // create -> before: undefined + after: {...}
        // delete -> before: {...} + after: undefined
        if (!change.before.exists) batch.set(uniqueNamesRef.doc(change.after.data()!.name), {}); // when the doc is created...
        if (!change.after.exists) batch.delete(uniqueNamesRef.doc(change.before.data()!.name)); // when the doc is deleted...
        // 📌 Aggregate the total number of faculties...
        const aggregateFacRef = db.collection('aggregate').doc('numbFaculties');
        const difference = !change.before.exists ? 1 : -1;
        if (!(await aggregateFacRef.get()).exists)
            // Initial value of the aggregator is the total number of faculties
            batch.set(aggregateFacRef, { value: (await db.collection('faculties').get()).size });
        else batch.update(aggregateFacRef, { value: admin.firestore.FieldValue.increment(difference) });
        return await batch.commit();
    });

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
    const bucket = admin.storage().bucket();
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
    main().catch(err => {
        console.error(JSON.stringify(err));
        if (err.code === 404) throw new https.HttpsError('not-found', 'The file you want to rename does not exist');
    });
});

// Renaming a file will first create a file with a new name -> triggers .onFinalize()
// and then delete the old one -> triggeres .onDelete()
export const onDropboxFileUpload = region('asia-southeast2')
    .storage.object()
    // Triggered each time a single file is uploaded. Even if the client uploads multiple files concurrently,
    // Cloud Storage only creates one at a time
    .onFinalize(object => aggregateDropboxSize(object, 'upload'));

export const onDropboxFileDelete = region('asia-southeast2')
    .storage.object()
    .onDelete(object => aggregateDropboxSize(object, 'delete'));
