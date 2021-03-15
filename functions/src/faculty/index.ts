import { firestore } from 'firebase-admin';
import { region } from 'firebase-functions';

export const handleFacultyWrite = region('asia-southeast2')
    .firestore.document('faculties/{facultyId}')
    .onWrite(async change => {
        const db = firestore();
        if (change.before.isEqual(change.after)) return; // this kind of update event changes nothing in the DB
        const batch = db.batch();
        // 📌 Add the faculty name to a collection of unique faculty names so that FireStore Security Rules can check for the uniqueness
        const uniqueNamesRef = db.collection('uniqueFacNames');
        if (change.before.exists && change.after.exists) {
            // when a doc is updated...
            batch.delete(uniqueNamesRef.doc(change.before.data()!.name));
            batch.set(uniqueNamesRef.doc(change.after.data()!.name), {});
            return batch.commit();
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
        else batch.update(aggregateFacRef, { value: firestore.FieldValue.increment(difference) });
        return batch.commit();
    });
