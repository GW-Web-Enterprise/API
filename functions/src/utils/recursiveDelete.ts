// You can import any function of the Firebase CLI into your Node.js application using the firebase-tools package.
// Since the firebase-tool package has no types, we have to use require
const { firestore } = require('firebase-tools');

export const recursiveDelete: (path: string) => Promise<void> = path =>
    // Using the CLI, you can recursively delete all the docs in a collection. It will even find and delete
    // "orphaned" docs that no longer have a parent. No need to implement your own recursive delete logic
    // Note the limitations: https://firebase.google.com/docs/firestore/solutions/delete-collections#limitations
    firestore
        .delete(path, {
            // @ts-ignore
            // FIREBASE_CONFIG is always populated by the Firebase CLI when deploying, but will not be present
            // when deploying via gcloud or other means.
            // process.env.GCP_PROJECT will throw the FirebaseError 'no currently active project'. Somehow the cloud runtime does not populate this env
            // FIREBASE_CONFIG: '{"storageBucket":"gw-enterprise.appspot.com","projectId":"gw-enterprise"}' is a JSON string
            project: JSON.parse(process.env.FIREBASE_CONFIG).projectId,
            // firebase login:ci -> firebase functions:config:set secrets.firebase_token="set_token_here" -> firebase deploy --only functions
            token: process.env.FIREBASE_TOKEN, // <- The local emulator or .yaml file for CI will populate this env
            recursive: true,
            yes: true
        })
        .catch(console.error);
