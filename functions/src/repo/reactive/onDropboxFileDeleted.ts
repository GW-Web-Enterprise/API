/* eslint-disable import/no-unresolved */
import { aggregateDropboxSize } from '@app/utils/aggregateDropboxSize';
import { parseFilePath } from '@app/utils/parseFilePath';
import { validateFileWrite } from '@app/utils/validateFileWrite';
import { region } from 'firebase-functions';

export const onDropboxFileDeleted = region('asia-southeast2')
    .storage.object()
    .onDelete(({ bucket, name = '', size }) => {
        if (bucket !== 'gw-enterprise.appspot.com') return null;
        if (!/^faculty_.+\/repo_.+\/dropbox_.+\//.test(name)) return null;
        const { facultyId, repoId, userId } = parseFilePath(name);
        return validateFileWrite({ facultyId, repoId, userId })
            .then(() => aggregateDropboxSize({ repoId, userId, size: -Number(size) }))
            .catch();
    });
