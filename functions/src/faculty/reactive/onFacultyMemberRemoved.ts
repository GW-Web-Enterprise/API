/* eslint-disable import/no-unresolved */
import { ADMIN_EMAIL } from '@app/constants';
import { IFacultyMember } from '@app/typings/schemas';
import { firestore } from 'firebase-admin';
import { region } from 'firebase-functions';

export const onFacultyMemberRemoved = region('asia-southeast2')
    .firestore.document('faculties/{facultyId}/members/{userId}')
    .onDelete(async (snapshot, { params }) => {
        const { facultyId, userId } = params;
        const memberDoc = snapshot.data() as IFacultyMember;
        sendMailToRemovedMember(facultyId, memberDoc);
        bringMemberBackToSysuser(facultyId, userId, memberDoc);
        // Destroy the link between user and faculty when this user is removed from the faculty
        const querySnapshot = await firestore()
            .collection('user_faculties')
            .where('userId', '==', userId)
            .where('facultyId', '==', facultyId)
            .get();
        querySnapshot.docs[0].ref.delete();
    });

async function sendMailToRemovedMember(facultyId: string, { email, displayName }: IFacultyMember) {
    const docSnapshot = await firestore().collection('faculties').doc(facultyId).get();
    const facultyName = docSnapshot.get('name');
    firestore()
        .collection('mails')
        .add({
            to: email,
            message: {
                subject: 'You have just been removed from a faculty',
                html: `<p>Hello ${displayName},</p>
                    <p>Admin has removed you from the faculty ${facultyName}</p>
                    <p>If you think this is a mistake, please contact admin immediately via the email ${ADMIN_EMAIL}</p>
                    <p>Thanks for reading,</p>
                    <p>Your GW Web Enterprise Group 2 team</p>`
            }
        });
}

async function bringMemberBackToSysuser(
    facultyId: string,
    userId: string,
    { email, displayName, photoURL }: IFacultyMember
) {
    const facultyRef = firestore().collection('faculties').doc(facultyId);
    (await facultyRef.get()).exists && // Ignore deleted faculty
        facultyRef.collection('sysusers').doc(userId).create({ email, displayName, photoURL });
}
