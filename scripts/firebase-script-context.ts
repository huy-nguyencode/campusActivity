import { db } from '../functions/src/shared/firestore-admin';

/** Development data should use the emulator unless the operator opts into cloud writes. */
export function getScriptFirestore() {
    if (!process.env.FIRESTORE_EMULATOR_HOST && !process.argv.includes('--production')) {
        throw new Error(
            'Set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 for local data, ' +
            'or pass --production to explicitly use the cloud database.'
        );
    }
    return db;
}
