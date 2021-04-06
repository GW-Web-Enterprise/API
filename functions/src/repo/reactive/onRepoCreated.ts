/* eslint-disable import/no-unresolved */
import { ADMIN_EMAIL } from '@app/constants';
import { IFacultyMember, IRepo } from '@app/typings/schemas';
import { firestore } from 'firebase-admin';
import { region } from 'firebase-functions';

export const onRepoCreated = region('asia-southeast2')
    .firestore.document('repos/{repoId}')
    .onCreate(async snapshot => {
        const { name, facultyId } = snapshot.data() as IRepo;
        const facultyRef = firestore().collection('faculties').doc(facultyId);
        const facultySnapshot = await facultyRef.get();
        const facultyName = facultySnapshot.get('name');
        const querySnapshot = await facultyRef.collection('members').get();
        querySnapshot.forEach(doc => {
            const { displayName, email, role } = doc.data() as IFacultyMember;
            const note =
                role === 'student'
                    ? // eslint-disable-next-line quotes
                      `You must upload your coursework before the repo's close date and time`
                    : 'You must review the coursework of your students in this repo after the close date and time';
            firestore()
                .collection('mails')
                .add({
                    to: email,
                    message: {
                        subject: 'New repo is created in your faculty',
                        html: `<p>Hello ${displayName},</p>
                            <p>Admin has just opened a repo ${name} in the faculty ${facultyName} that you are a ${role} of</p>
                            <p>${note}</p>
                            <p>If you think this is a mistake, please contact admin immediately via the email ${ADMIN_EMAIL}</p>
                            <p>Thanks for reading,</p>
                            <p>Your GW Web Enterprise Group 2 team</p>`
                    }
                });
        });
    });
