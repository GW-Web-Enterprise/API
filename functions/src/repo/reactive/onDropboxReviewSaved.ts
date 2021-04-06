/* eslint-disable import/no-unresolved */
import { IDropbox } from '@app/typings/schemas';
import { firestore } from 'firebase-admin';
import { region } from 'firebase-functions';

export const onDropboxReviewSaved = region('asia-southeast2')
    .firestore.document('repos/{repoId}/dropboxes/{dropboxId}')
    .onUpdate(async change => {
        if (change.before.isEqual(change.after)) return null;
        const {
            feedback,
            reviewerName,
            reviewerEmail,
            status,
            ownerName,
            ownerEmail,
            facultyId,
            repoId
        } = change.after.data() as IDropbox;
        const [facultySnapshot, repoSnapshot] = await Promise.all([
            firestore().collection('repos').doc(repoId).get(),
            firestore().collection('faculties').doc(facultyId).get()
        ]);
        const facultyName = facultySnapshot.get('name');
        const repoName = repoSnapshot.get('name');
        return firestore()
            .collection('mails')
            .add({
                to: ownerEmail,
                message: {
                    subject: 'There is a new review of your dropbox',
                    html: `<p>Hello ${ownerName},</p>
                        <p>Coordinator ${reviewerName} in the faculty ${facultyName} has just ${status} your dropbox in the repo ${repoName} with the following feedback: </p>
                        <p>${feedback || '😊 🙂 😄'}</p>
                        <br><br>
                        <p>If you have any concern about this review, you can contact this faculty coordinator directly via the email ${reviewerEmail}</p>
                        <p>Thanks for reading,</p>
                        <p>Your GW Web Enterprise Group 2 team</p>`
                }
            });
    });
