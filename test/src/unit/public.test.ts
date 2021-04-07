import 'module-alias/register';
import { getFirestore } from '@app/utils/getFirestore';
import { assertFails, assertSucceeds, clearFirestoreData } from '@firebase/rules-unit-testing';
import { TokenOptions } from '@firebase/rules-unit-testing/dist/src/api';
import { PROJECT_ID } from '@app/constants';
import { getAdminFirestore } from '@app/utils/getAdminFirestore';

const auth: TokenOptions = { uid: 'guest_user', isGuest: true, isManager: true, email: 'guest@gmail.com' };
const db = getFirestore(auth);
const facsRef = db.collection('faculties');

describe(`As a user with a role 'guest' or 'manager' in the system, I`, () => {
    it('Can view a list of faculties', async () => await assertSucceeds(facsRef.get()));

    it('Cannot create faculty', async () => await assertFails(facsRef.add({ name: 'fake name' })));

    it(`Cannot change any faculty's name`, async () => {
        getAdminFirestore().collection('faculties').doc('fakeFacId').set({ name: 'random name' });
        await assertFails(facsRef.doc('fakeFacId').update({ name: 'changed name' }));
    });

    it('Cannot view sysusers in a particular faculty', async () =>
        await assertFails(facsRef.doc('fakeFacId').collection('sysusers').get()));

    it('Cannot access list of members in a particular faculty', async () =>
        // read, create, delete actions are evaluated against the same condition in Sec Rules
        await assertFails(facsRef.doc('fakeFacId').collection('members').get()));

    it(`Cannot write to a faculty's repo`, async () => {
        getAdminFirestore().collection('repos').doc('fakeRepoId').set({ name: 'random name', facultyId: 'fakeFacId' });
        await assertFails(db.collection('repos').doc('fakeRepoId').delete()); // same logic is applied to repo writes in Sec Rules
    });

    it('Cannot delete any faculty', async () => await assertFails(facsRef.doc('fakeFacId').delete()));
});

// Clear all data after all tests are done
after(async () => await clearFirestoreData({ projectId: PROJECT_ID }));
