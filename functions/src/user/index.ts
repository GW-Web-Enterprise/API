import { auth, firestore } from 'firebase-admin';
import { region } from 'firebase-functions';
import { UserRecord } from 'firebase-functions/lib/providers/auth';

export const onUserCreate = region('asia-southeast2')
    .auth.user()
    .onCreate(async newUser => {
        aggregateSysUsers().catch(console.error);
        addNewSysUserToFaculties(newUser).catch(console.error);
    });

async function aggregateSysUsers() {
    const aggregateRef = firestore().collection('aggregate').doc('numbSysUsers');
    if (!(await aggregateRef.get()).exists)
        // The initial value of numbSysUsers is the total number of existing users in the system
        aggregateRef.set({ value: (await auth().listUsers()).users.length }, { merge: true });
    else aggregateRef.set({ value: firestore.FieldValue.increment(1) }, { merge: true });
}

async function addNewSysUserToFaculties({ uid, photoURL, email, displayName }: UserRecord) {
    const snapshot = await firestore().collection('faculties').get();
    snapshot.docs.map(({ ref }) => ref.collection('sysusers').doc(uid).create({ photoURL, email, displayName }));
}
