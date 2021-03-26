/* eslint-disable import/no-unresolved */
import { recursiveDelete } from '@app/utils/recursiveDelete';
import { region } from 'firebase-functions';

export const onRepoDeleted = region('asia-southeast2')
    .firestore.document('repos/{repoId}')
    .onDelete(snapshot => recursiveDelete(snapshot.ref.path)); // triggers onDropboxDeleted() for each deleted dropbox in the repo
