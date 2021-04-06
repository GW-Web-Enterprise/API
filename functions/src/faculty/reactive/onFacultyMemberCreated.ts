/* eslint-disable import/no-unresolved */
import { ADMIN_EMAIL } from '@app/constants';
import { IFacultyMember } from '@app/typings/schemas';
import { firestore } from 'firebase-admin';
import { region } from 'firebase-functions';

export const onFacultyMemberCreated = region('asia-southeast2')
    .firestore.document('faculties/{facultyId}/members/{userId}')
    .onCreate(async (snapshot, { params }) => {
        const { facultyId, userId } = params;
        const { role, email, displayName } = snapshot.data() as IFacultyMember;
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
        firestore()
            .collection('mails')
            .add({
                to: email,
                message: {
                    subject: 'You have just been added to a faculty',
                    html: `<p>Hello ${displayName},</p>
                    <p>Admin has assigned you to the faculty ${facultyName} as a ${role}</p>
                    <p>If this is done by mistake, please contact admin immediately via the email ${ADMIN_EMAIL}</p>
                    <p>Thanks for reading,</p>
                    <p>Your GW Web Enterprise Group 2 team</p>`
                }
            });
    });
