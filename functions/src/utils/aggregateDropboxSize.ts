import { firestore } from 'firebase-admin';

type Arguments = { repoId: string; userId: string; size: number };
export function aggregateDropboxSize({ repoId, userId, size }: Arguments) {
    console.log(`Aggregating dropbox of user_${userId} in repo_${repoId}`, { size });
    const db = firestore();
    const dropboxesRef = db.collection('repos').doc(repoId).collection('dropboxes');
    async function main() {
        const querySnapshot = await dropboxesRef.where('ownerId', '==', userId).get();
        const dropboxId = querySnapshot.docs[0]?.id;
        dropboxId && (await dropboxesRef.doc(dropboxId).update({ size: firestore.FieldValue.increment(size) }));
    }
    return main().catch(console.error);
}
