/* eslint-disable import/no-unresolved */
import { IFacultyMember } from '@app/typings/schemas';
import { firestore } from 'firebase-admin';
import { region } from 'firebase-functions';

export const onFacultyMemberRemoved = region('asia-southeast2')
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
