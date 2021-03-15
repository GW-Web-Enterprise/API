import admin from 'firebase-admin';
import { ObjectMetadata } from 'firebase-functions/lib/providers/storage';

export function aggregateDropboxSize({ bucket, name = '', size }: ObjectMetadata, action: 'upload' | 'delete') {
    // Rename file -> 'metageneration' of the deleted file object with the old name is 1.
    // However, when an existing file is deleted -> 'metageneration' is 2
    // Only keep track of changes to this bucket
    if (bucket !== 'gw-enterprise.appspot.com') return null;
    // Only handle event that takes places at the directory: /faculty_${facultyId}/repo_${repoId}/dropbox_${userId}
    if (!/^faculty_.+\/repo_.+\/dropbox_.+/.test(name)) return null;
    const repoId = name.match(/\/repo_(.*)\/dropbox/)![1];
    const userId = name.match(/\/dropbox_(.*)\//)![1];
    const difference = action === 'upload' ? Number(size) : -Number(size);
    console.log(JSON.stringify({ name, difference }));
    const db = admin.firestore();
    const dropboxesRef = db.collection('repos').doc(repoId).collection('dropboxes');
    async function main() {
        const querySnapshot = await dropboxesRef.where('ownerId', '==', userId).get();
        const dropboxId = querySnapshot.docs[0].id;
        await dropboxesRef.doc(dropboxId).update({ size: admin.firestore.FieldValue.increment(difference) });
    }
    return main().catch(err => console.error(JSON.stringify(err)));
}
