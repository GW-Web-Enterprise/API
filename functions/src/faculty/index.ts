import { firestore } from 'firebase-admin';
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
        if (!change.before.exists) uniqueNamesRef.doc(change.after.data()!.name).set({}); // when a doc is created...
        if (!change.after.exists) uniqueNamesRef.doc(change.before.data()!.name).delete(); // when a doc is deleted...
        // 📌 Aggregate the total number of faculties...
        const aggregateFacRef = db.collection('aggregate').doc('numbFaculties');
        const difference = !change.before.exists ? 1 : -1;
        if (!(await aggregateFacRef.get()).exists)
            // Initial value of the aggregator is the total number of faculties
            aggregateFacRef.set({ value: (await db.collection('faculties').get()).size });
        else aggregateFacRef.update({ value: firestore.FieldValue.increment(difference) });
    });

export const addSysUserToFaculties = region('asia-southeast2')
    .auth.user()
    .onCreate(async ({ uid, photoURL, email, displayName }) => {
        const snapshot = await firestore().collection('faculties').get();
        return snapshot.docs.map(({ ref }) =>
            ref.collection('sysusers').doc(uid).create({ photoURL, email, displayName })
        );
    });
