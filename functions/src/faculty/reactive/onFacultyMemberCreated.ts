/* eslint-disable import/no-unresolved */
import { IFacultyMember } from '@app/typings/schemas';
import { firestore } from 'firebase-admin';
import { region } from 'firebase-functions';

export const onFacultyMemberCreated = region('asia-southeast2')
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
