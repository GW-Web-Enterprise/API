/* eslint-disable import/no-unresolved */
import { aggregateDropboxSize } from '@app/utils/aggregateDropboxSize';
import { parseFilePath } from '@app/utils/parseFilePath';
import { validateFileWrite } from '@app/utils/validateFileWrite';
import { storage } from 'firebase-admin';
import { region } from 'firebase-functions';

export const onDropboxFileUploaded = region('asia-southeast2')
    .storage.object()
    .onFinalize(({ bucket, name = '', size }) => {
        if (bucket !== 'gw-enterprise.appspot.com') return null;
        if (!/^faculty_.+\/repo_.+\/dropbox_.+\//.test(name)) return null;
        const { facultyId, repoId, userId } = parseFilePath(name);
        return validateFileWrite({ facultyId, repoId, userId })
            .then(() => aggregateDropboxSize({ repoId, userId, size: Number(size) }))
            .catch(() => {
                // Delete invalid file
                const bucket = storage().bucket();
                console.log('Deleting invalid file ', name);
                bucket.file(name).delete().catch(console.error);
            });
    });
