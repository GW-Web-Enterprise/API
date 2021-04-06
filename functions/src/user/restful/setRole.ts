/* eslint-disable import/no-unresolved */
import { ADMIN_EMAIL } from '@app/constants';
import { auth, firestore } from 'firebase-admin';
import { https, region } from 'firebase-functions';

export const setRole = region('asia-southeast2').https.onCall((data, ctx) => {
    const user = ctx.auth;
    if (!user) throw new https.HttpsError('unauthenticated', 'You are not logged in!');
    if (!user.token.isAdmin && user.token.email !== ADMIN_EMAIL)
        throw new https.HttpsError('permission-denied', 'You are not allowed to set global role of system user');
    const { isGuest = false, isManager = false, isAdmin = false, uid = '' } = data;
    if (isGuest === isManager)
        throw new https.HttpsError('invalid-argument', 'One must be true and the other must be false');
    return Promise.all([
        auth().setCustomUserClaims(uid, { isGuest, isManager, isAdmin }).catch(console.error),
        sendMailToUser(uid, isManager ? 'manager' : 'guest')
    ]);
});

async function sendMailToUser(uid: string, sysrole: 'manager' | 'guest') {
    const { displayName, email } = await auth().getUser(uid);
    const guestRights =
        'you can only access faculties assigned to you by the admin and view reports at the overview page';
    const managerRights =
        'you can freely access any faculty in the system and download files uploaded from any student in the faculty';
    displayName &&
        email &&
        firestore()
            .collection('mails')
            .add({
                to: email,
                message: {
                    subject: 'Your system role has just been changed',
                    html: `<p>Hello ${displayName},</p>
                            <p>Admin has set your role to ${sysrole}</p>
                            <p>With this system role, ${sysrole === 'manager' ? managerRights : guestRights}</p>
                            <p>If you are currently signed in, please logout and login back again for the new role to take effect</p>
                            <p>If you think this is a mistake, please contact admin immediately via the email ${ADMIN_EMAIL}</p>
                            <p>Thanks for reading,</p>
                            <p>Your GW Web Enterprise Group 2 team</p>`
                }
            });
}
