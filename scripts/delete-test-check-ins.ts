import { getScriptFirestore } from './firebase-script-context';

const db = getScriptFirestore();

async function deleteTestCheckIns(): Promise<void> {
    let deleted = 0;
    while (true) {
        const snapshot = await db.collection('checkins')
            .where('uid', '==', 'test-script').limit(500).get();
        if (snapshot.empty) break;
        const batch = db.batch();
        snapshot.docs.forEach((document) => batch.delete(document.ref));
        await batch.commit();
        deleted += snapshot.size;
        if (snapshot.size < 500) break;
    }
    console.log(`Deleted ${deleted} test check-ins`);
}

deleteTestCheckIns().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
