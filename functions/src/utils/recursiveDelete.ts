// You can import any function of the Firebase CLI into your Node.js application using the firebase-tools package.
// Since the firebase-tool package has no types, we have to use require
const { firestore } = require('firebase-tools');

export const recursiveDelete = (path: string) =>
    // Using the CLI, you can recursively delete all the docs in a collection. It will even find and delete
    // "orphaned" docs that no longer have a parent. No need to implement your own recursive delete logic
    // Note the limitations: https://firebase.google.com/docs/firestore/solutions/delete-collections#limitations
    firestore
        .delete(path, {
            project: process.env.GCP_PROJECT,
            // firebase login:ci -> firebase functions:config:set secrets.firebase_token="set_token_here" -> firebase deploy --only functions
            token: process.env.FIREBASE_TOKEN, // This is passed from the .yaml file used for GitHub Actions or the local emulator
            recursive: true,
            yes: true
        })
        .then(() => console.log('All envs: ', process.env))
        .catch(console.error);
