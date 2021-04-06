/* eslint-disable import/no-unresolved */
import { ADMIN_EMAIL } from '@app/constants';
import { IFacultyMember, IRepo } from '@app/typings/schemas';
import { firestore } from 'firebase-admin';
import { region } from 'firebase-functions';

export const onRepoUpdated = region('asia-southeast2')
    .firestore.document('repos/{repoId}')
    .onUpdate(async change => {
        if (change.before.isEqual(change.after)) return;
        const currentCloseTs: firestore.Timestamp = change.before.get('closeTimestamp');
        const newCloseTs: firestore.Timestamp = change.after.get('closeTimestamp');

        const currentFinalTs: firestore.Timestamp = change.before.get('finalTimestamp');
        const newFinalTs: firestore.Timestamp = change.after.get('finalTimestamp');

        const closeTsChanged = currentCloseTs.valueOf() !== newCloseTs.valueOf();
        const finalTsChanged = currentFinalTs.valueOf() !== newFinalTs.valueOf();

        // Only send emails when repo's deadlines are updated
        if (closeTsChanged || finalTsChanged) {
            const { name, facultyId } = change.after.data() as IRepo;
            const facultyRef = firestore().collection('faculties').doc(facultyId);
            const facultySnapshot = await facultyRef.get();
            const facultyName = facultySnapshot.get('name');
            const querySnapshot = await facultyRef.collection('members').get();
            return querySnapshot.forEach(doc => {
                const { displayName, email, role } = doc.data() as IFacultyMember;
                firestore()
                    .collection('mails')
                    .add({
                        to: email,
                        message: {
                            subject: 'An existing repo in your faculty is updated',
                            html: `<p>Hello ${displayName},</p>
                            <p>Admin has just updated the deadlines of the repo ${name} in the faculty ${facultyName} that you are a ${role} of</p>
                            <p>If you think this is a mistake, please contact admin immediately via the email ${ADMIN_EMAIL}</p>
                            <p>Thanks for reading,</p>
                            <p>Your GW Web Enterprise Group 2 team</p>`
                        }
                    });
            });
        }
    });
