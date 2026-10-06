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
 *   npm run seed:places
 *
 * Or with emulator:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 npm run seed:places
 *
 * LEARNING POINT: TypeScript Execution
 *
 * This script uses tsx to run TypeScript directly without compiling.
 * For production scripts, you might want to compile first for performance.
 */

import { GeoPoint } from 'firebase-admin/firestore';
import { getScriptFirestore } from './firebase-script-context';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

const db = getScriptFirestore();
const scriptDirectory = dirname(fileURLToPath(import.meta.url));

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
    const dataPath = join(scriptDirectory, '..', 'data', 'campus-places.json');

    if (!existsSync(dataPath)) {
        console.error(`Error: campus-places.json not found at ${dataPath}`);
        process.exit(1);
    }

    const fileContent = readFileSync(dataPath, 'utf-8');
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
            location: new GeoPoint(
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
 * 1. Run directly: npm run seed:places
 * 2. Imported as a module: import { seedPlaces } from './scripts/seed-campus-places'
 *
 * In ESM, compare this module URL with the entry file URL instead of using
 * CommonJS's require.main.
 */
const isDirectExecution = Boolean(process.argv[1])
    && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
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
