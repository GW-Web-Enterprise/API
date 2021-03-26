/* eslint-disable import/no-unresolved */
import { aggregateDropboxSize } from '@app/utils/aggregateDropboxSize';
import { region } from 'firebase-functions';

export const onDropboxFileUploaded = region('asia-southeast2')
    .storage.object()
    .onFinalize(object => aggregateDropboxSize(object, 'upload'));
