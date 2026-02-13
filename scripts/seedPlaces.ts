/**
 * Seed Script: Load initial places into Firestore
 *
 * LEARNING POINT: Database Seeding
 *
 * Seed scripts populate your database with initial data. They're useful for:
 * 1. Development - start with realistic test data
 * 2. Testing - ensure consistent starting state
 * 3. Production - load initial required data
 *
 * Usage:
 *   npx ts-node scripts/seedPlaces.ts
 *
 * Or with emulator:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 npx ts-node scripts/seedPlaces.ts
 *
 * LEARNING POINT: TypeScript Execution
 *
 * This script uses ts-node to run TypeScript directly without compiling.
 * For production scripts, you might want to compile first for performance.
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * LEARNING POINT: Service Account Authentication
 *
 * Firebase Admin SDK needs service account credentials to write to Firestore.
 * Options:
 * 1. Set GOOGLE_APPLICATION_CREDENTIALS env var to service account JSON path
 * 2. Use initializeApp() when running in Cloud Functions (automatic)
 * 3. Pass credentials directly (not recommended for security)
 *
 * For local development, download service account from Firebase Console:
 * Project Settings > Service Accounts > Generate new private key
 */

// Initialize Firebase Admin
// When using emulator, it auto-configures from FIRESTORE_EMULATOR_HOST
if (!admin.apps.length) {
    admin.initializeApp({
        // Uses default credentials from GOOGLE_APPLICATION_CREDENTIALS
        // or from the emulator if FIRESTORE_EMULATOR_HOST is set
    });
}

const db = admin.firestore();

interface PlaceData {
    id: string;
    name: string;
    type: string;
    location: {
        latitude: number;
        longitude: number;
    };
    busyPercent: number;
    lastUpdate: null;
}

interface PlacesFile {
    places: PlaceData[];
}

/**
 * LEARNING POINT: Batch Writes
 *
 * When writing multiple documents, use batches:
 * 1. Atomic - all succeed or all fail
 * 2. Efficient - single network roundtrip
 * 3. Limited to 500 operations per batch
 *
 * For larger datasets, split into multiple batches.
 */
async function seedPlaces(): Promise<void> {
    console.log('Starting places seed...\n');

    // Read the places data file
    const dataPath = path.join(__dirname, '..', 'data', 'places.json');

    if (!fs.existsSync(dataPath)) {
        console.error(`Error: places.json not found at ${dataPath}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data: PlacesFile = JSON.parse(fileContent);

    console.log(`Found ${data.places.length} places to seed\n`);

    // Create a batch for efficient writes
    const batch = db.batch();

    for (const place of data.places) {
        const docRef = db.collection('places').doc(place.id);

        /**
         * LEARNING POINT: Document Structure
         *
         * We use the place.id as the document ID for:
         * 1. Predictable IDs - easy to reference in code
         * 2. Idempotent seeds - running twice won't create duplicates
         * 3. Direct lookups - no need to query by ID field
         */
        batch.set(docRef, {
            name: place.name,
            type: place.type,
            location: new admin.firestore.GeoPoint(
                place.location.latitude,
                place.location.longitude
            ),
            busyPercent: place.busyPercent,
            lastUpdate: null,
        });

        console.log(`  + ${place.name} (${place.id})`);
    }

    // Commit all writes
    await batch.commit();

    console.log(`\nSuccessfully seeded ${data.places.length} places!`);
}

/**
 * LEARNING POINT: Script Entry Point Pattern
 *
 * This pattern allows the file to be both:
 * 1. Run directly: npx ts-node scripts/seedPlaces.ts
 * 2. Imported as a module: import { seedPlaces } from './scripts/seedPlaces'
 *
 * require.main === module is true only when run directly.
 */
if (require.main === module) {
    seedPlaces()
        .then(() => {
            console.log('\nSeed complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\nSeed failed:', error);
            process.exit(1);
        });
}

export { seedPlaces };
