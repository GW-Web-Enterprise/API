import 'module-alias/register';
import { PROJECT_ID } from '@app/constants';
import { getAdminFirestore } from '@app/utils/getAdminFirestore';
import { getFirestore } from '@app/utils/getFirestore';
import { assertSucceeds, clearFirestoreData, firestore } from '@firebase/rules-unit-testing';
import { TokenOptions } from '@firebase/rules-unit-testing/dist/src/api';

const adminAuth: TokenOptions = { uid: 'adminUid', isAdmin: true };
const managerAuth: TokenOptions = { uid: 'managerUid', isManager: true };
const studentAuth: TokenOptions = { uid: 'studentUid', isGuest: true };
const coordinatorAuth: TokenOptions = { uid: 'coordinatorUid', isGuest: true };

const getDropboxesRef = (auth: TokenOptions) =>
    getFirestore(auth).collection('repos').doc('repoId').collection('dropboxes');

before(`Seeding faculty members, faculty's repo, and repo's dropbox...`, () =>
    (async () => {
        const facultyRef = getAdminFirestore().collection('faculties').doc('facultyId');
        const repoRef = getAdminFirestore().collection('repos').doc('repoId');
        const dropboxRef = repoRef.collection('dropboxes').doc('dropboxId');
        await facultyRef.set({ name: 'faculty name' });
        await facultyRef.collection('members').doc('studentUid').set({ role: 'student' });
        await facultyRef.collection('members').doc('coordinatorUid').set({ role: 'coordinator' });

        await repoRef.set({ name: 'repo name', facultyId: 'facultyId' });
        await dropboxRef.set({ facultyId: 'facultyId', repoId: 'repoId', ownerId: 'studentUid' });
    })().catch(console.error)
);

describe(`Resource: dropboxes`, () => {
    it('Admin can read any dropbox', async () => await assertSucceeds(getDropboxesRef(adminAuth).get()));

    it('Manager can read any dropbox', async () => await assertSucceeds(getDropboxesRef(managerAuth).get()));

    it('Coordinator can only read dropboxes in his faculty', async () =>
        await assertSucceeds(getDropboxesRef(coordinatorAuth).get()));

    it('Student can only read his own dropbox', async () =>
        await assertSucceeds(getDropboxesRef(studentAuth).doc('dropboxId').get()));

    it('Coordinator can only update allowed fields of dropbox', async () =>
        await assertSucceeds(
            getDropboxesRef(coordinatorAuth).doc('dropboxId').update({
                reviewerId: 'coordinatorUid',
                reviewerName: 'Bill Gates',
                reviewerEmail: 'billgates@gmail.com',
                feedback: 'Amazing',
                status: 'approved',
                reviewedAt: firestore.FieldValue.serverTimestamp()
            })
        ));
});

after(async () => await clearFirestoreData({ projectId: PROJECT_ID }));
