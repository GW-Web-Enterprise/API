import { firestore } from 'firebase-admin';
import { https } from 'firebase-functions';

type DropboxParts = { facultyId: string; repoId: string; userId: string };
export const validateFileWrite = async ({
    facultyId,
    repoId,
    userId,
    performRename
}: DropboxParts & { performRename?: boolean }) => {
    const db = firestore();
    const [repoSnapshot, memberSnapshot] = await Promise.all([
        db.collection('repos').doc(repoId).get(),
        db.collection('faculties').doc(facultyId).collection('members').doc(userId).get()
    ]);
    const timestamp: firestore.Timestamp = performRename
        ? repoSnapshot.get('finalTimestamp')
        : repoSnapshot.get('closeTimestamp');
    if (!timestamp) return;
    if (firestore.Timestamp.now().valueOf() > timestamp.valueOf())
        throw new https.HttpsError(
            'permission-denied',
            `Not allowed to ${performRename ? 'rename' : 'delete'} file after the ${
                performRename ? 'final' : 'close'
            } date and time`
        );
    if (memberSnapshot.get('role') !== 'student')
        throw new https.HttpsError('permission-denied', 'You are not student of this faculty');
};
