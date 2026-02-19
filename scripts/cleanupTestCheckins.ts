import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

async function cleanup(): Promise<void> {
    const snap = await db.collection('checkins').where('uid', '==', 'test-script').get();
    console.log(`Found ${snap.size} test check-ins to delete`);
    if (snap.size === 0) { process.exit(0); return; }
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Deleted ${snap.size} test check-ins`);
}

cleanup().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
