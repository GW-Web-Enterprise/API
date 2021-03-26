/* eslint-disable import/no-unresolved */
import { aggregateDropboxSize } from '@app/utils/aggregateDropboxSize';
import { region } from 'firebase-functions';

export const onDropboxFileDeleted = region('asia-southeast2')
    .storage.object()
    .onDelete(object => aggregateDropboxSize(object, 'delete'));
