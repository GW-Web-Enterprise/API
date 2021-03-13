import { Change, EventContext } from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

type IEventHandler = (change: Change<DocumentSnapshot>, context: EventContext) => any;
export const eventHandler = (asyncFn: IEventHandler) => (change: Change<DocumentSnapshot>, context: EventContext) =>
    Promise.resolve(asyncFn(change, context)).catch(console.log);
