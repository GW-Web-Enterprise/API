import { storage } from 'firebase-admin';
import { region } from 'firebase-functions';

export const onDropboxDeleted = region('asia-southeast2')
    .firestore.document('repos/{repoId}/dropboxes/{dropboxId}')
    .onDelete(snapshot => {
        const { facultyId, repoId, ownerId } = snapshot.data();
        return (
            storage()
                .bucket()
                // force will suppress errors until all files have been processed
                .deleteFiles({ prefix: `faculty_${facultyId}/repo_${repoId}/dropbox_${ownerId}`, force: true })
                .catch(console.error)
        );
    });
