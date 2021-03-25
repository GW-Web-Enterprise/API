import { auth, firestore } from 'firebase-admin';
import { region } from 'firebase-functions';
import { UserRecord } from 'firebase-functions/lib/providers/auth';

export const onUserCreate = region('asia-southeast2')
    .auth.user()
    .onCreate(async newUser => {
        aggregateSysusers().catch(console.error);
        auth().setCustomUserClaims(newUser.uid, { isGuest: true }).catch(console.error);
        addNewSysuserToFaculties(newUser).catch(console.error);
    });

async function aggregateSysusers() {
    const aggregateRef = firestore().collection('aggregate').doc('numbSysusers');
    if (!(await aggregateRef.get()).exists)
        // The initial value of numbSysusers is the total number of existing users in the system
        aggregateRef.set({ value: (await auth().listUsers()).users.length }, { merge: true });
    else aggregateRef.set({ value: firestore.FieldValue.increment(1) }, { merge: true });
}

async function addNewSysuserToFaculties({ uid, photoURL, email, displayName }: UserRecord) {
    const snapshot = await firestore().collection('faculties').get();
    return Promise.all(
        snapshot.docs.map(({ ref }) => ref.collection('sysusers').doc(uid).create({ photoURL, email, displayName }))
    );
}
