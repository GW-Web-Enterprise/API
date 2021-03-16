/* eslint-disable import/no-unresolved */
import { recursiveDelete } from '@app/utils/recursiveDelete';
import { firestore, auth } from 'firebase-admin';
import { region } from 'firebase-functions';

export const handleFacultyWrite = region('asia-southeast2')
    .firestore.document('faculties/{facultyId}')
    .onWrite(async change => {
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
            copySysUsersToNewFaculty(change.after.ref);
        }
        if (!change.after.exists) {
            // when a doc is deleted...
            uniqueNamesRef.doc(change.before.data()!.name).delete();
            recursiveDelete(change.after.ref.path); // path looks like this: faculties/Dqf2XNNoCNPv5rJSgK9p
        }
        // 📌 Aggregate the total number of faculties...
        const aggregateFacRef = db.collection('aggregate').doc('numbFaculties');
        const difference = !change.before.exists ? 1 : -1;
        if (!(await aggregateFacRef.get()).exists)
            // Initial value of the aggregator is the total number of faculties
            aggregateFacRef.set({ value: (await db.collection('faculties').get()).size });
        else aggregateFacRef.update({ value: firestore.FieldValue.increment(difference) });
    });

function copySysUsersToNewFaculty(facultyRef: firestore.DocumentReference) {
    (async function () {
        const { users } = await auth().listUsers();
        await Promise.all(
            users.map(({ uid, email, displayName, photoURL = null }) =>
                facultyRef.collection('sysusers').doc(uid).create({ photoURL, email, displayName })
            )
        );
    })().catch(console.error);
}

export const addSysUserToFaculties = region('asia-southeast2')
    .auth.user()
    .onCreate(async ({ uid, photoURL = null, email, displayName }) => {
        const snapshot = await firestore().collection('faculties').get();
        return snapshot.docs.map(({ ref }) =>
            ref.collection('sysusers').doc(uid).create({ photoURL, email, displayName })
        );
    });
