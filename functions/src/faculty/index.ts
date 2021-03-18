/* eslint-disable import/no-unresolved */
import { recursiveDelete } from '@app/utils/recursiveDelete';
import { auth, firestore } from 'firebase-admin';
import { region } from 'firebase-functions';

export const onFacultyWrite = region('asia-southeast2')
    .firestore.document('faculties/{facultyId}')
    .onWrite(async (change, { params }) => {
        if (change.before.isEqual(change.after)) return; // this kind of update event changes nothing in the DB
        // 📌 Add the faculty name to a collection of unique faculty names so that Security Rules can check if the name is unique
        const db = firestore();
        const uniqueNamesRef = db.collection('uniqueFacNames');
        if (change.before.exists && change.after.exists) {
            // when a doc is updated...
            uniqueNamesRef.doc(change.before.data()!.name).delete();
            uniqueNamesRef.doc(change.after.data()!.name).set({});
            return;
        }
        // create -> before: undefined + after: {...}
        // delete -> before: {...} + after: undefined
        if (!change.before.exists) {
            // when a doc is created...
            uniqueNamesRef.doc(change.after.data()!.name).set({});
            copySysusersToNewFaculty(change.after.ref);
        }
        if (!change.after.exists) {
            // when a doc is deleted...
            uniqueNamesRef.doc(change.before.data()!.name).delete();
            recursiveDelete(change.after.ref.path); // path looks like this: faculties/Dqf2XNNoCNPv5rJSgK9p
            deleteFacultyRepos(params.facultyId);
        }
        // 📌 Aggregate the total number of faculties...
        const aggregateFacRef = db.collection('aggregate').doc('numbFaculties');
        const difference = !change.before.exists ? 1 : -1;
        if (!(await aggregateFacRef.get()).exists)
            // The initial value of numbFaculties is the total number of existing faculties
            aggregateFacRef.set({ value: (await db.collection('faculties').get()).size }, { merge: true });
        else aggregateFacRef.set({ value: firestore.FieldValue.increment(difference) }, { merge: true });
    });

function copySysusersToNewFaculty(facultyRef: firestore.DocumentReference) {
    (async function () {
        const { users } = await auth().listUsers();
        await Promise.all(
            users.map(({ uid, email, displayName, photoURL = null }) =>
                facultyRef.collection('sysusers').doc(uid).create({ photoURL, email, displayName })
            )
        );
    })().catch(console.error);
}

async function deleteFacultyRepos(facultyId: string) {
    const querySnapshot = await firestore().collection('repos').where('facultyId', '==', facultyId).get();
    querySnapshot.docs.forEach(({ ref }) => ref.delete());
}

type IFacultyMember = { email: string; displayName: string; photoURL: string | null; role: 'student' | 'coordinator' };
export const onFacultyMemberAdd = region('asia-southeast2')
    .firestore.document('faculties/{facultyId}/members/{userId}')
    .onCreate(async (snapshot, { params }) => {
        const { facultyId, userId } = params;
        const { role } = snapshot.data() as IFacultyMember;
        const facultiesRef = firestore().collection('faculties');
        facultiesRef.doc(facultyId).collection('sysusers').doc(userId).delete();
        // Link the user to the faculty as soon as he/she becomes a member
        const docSnapshot = await facultiesRef.doc(facultyId).get();
        const facultyName = docSnapshot.get('name');
        firestore().collection('user_faculties').add({
            userId,
            role,
            facultyId,
            facultyName,
            createdAt: firestore.FieldValue.serverTimestamp()
        });
    });

export const onFacultyMemberRemove = region('asia-southeast2')
    .firestore.document('faculties/{facultyId}/members/{userId}')
    .onDelete(async (snapshot, { params }) => {
        const { facultyId, userId } = params;
        bringMemberBackToSysuser(facultyId, userId, snapshot.data() as IFacultyMember);
        // Destroy the link between user and faculty when this user is removed from the faculty
        const querySnapshot = await firestore()
            .collection('user_faculties')
            .where('userId', '==', userId)
            .where('facultyId', '==', facultyId)
            .get();
        querySnapshot.docs[0].ref.delete();
    });

async function bringMemberBackToSysuser(
    facultyId: string,
    userId: string,
    { email, displayName, photoURL }: IFacultyMember
) {
    const facultyRef = firestore().collection('faculties').doc(facultyId);
    (await facultyRef.get()).exists && // Ignore deleted faculty
        facultyRef.collection('sysusers').doc(userId).create({ email, displayName, photoURL });
}
