const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');
const { aggregatePlaceCrowds } = require('../lib/operations/aggregate-place-crowds');
const { calculateBusyPercent } = require('../lib/domain/crowd-calculation');
const { parseClientLocation, validateCheckinLocation } = require('../lib/domain/check-in-validation');

const now = new Date('2026-10-05T12:00:00Z');
const atAge = (minutes) => Timestamp.fromMillis(now.getTime() - minutes * 60_000);

// Model the database operations, including empty queries, missing documents, and
// optimistic write conflicts. No credentials or production database are used.
function database({ places = [], reports = [], conflict = false } = {}) {
    const requests = [];
    const committed = [];
    const writes = [];
    const snapshots = new Map(places.map(({ id, ...data }) => [id, {
        id, exists: true, data: () => data, ref: { id }, updateTime: atAge(1),
    }]));
    return {
        requests, writes, committed,
        collection(name) {
            return {
                doc(id) { return { id }; },
                // An unfiltered get is deliberately absent: a full scan is a regression.
                where(field, operator, value) {
                    requests.push({ name, field, operator, value });
                    let docs;
                    if (name === 'checkins') {
                        docs = reports.filter((report) => report.timestamp.toMillis() >= value.toMillis())
                            .map((data) => ({ data: () => data }));
                    } else {
                        docs = [...snapshots.values()].filter((snapshot) => {
                            const data = snapshot.data();
                            return field === 'lastUpdate'
                                ? data.lastUpdate?.toMillis() > value.toMillis()
                                : data.busyPercent > value;
                        });
                    }
                    return { async get() { return { docs, size: docs.length }; } };
                },
            };
        },
        async getAll(...refs) {
            requests.push({ getAll: refs.map((ref) => ref.id) });
            return refs.map((ref) => snapshots.get(ref.id) ?? { id: ref.id, exists: false });
        },
        batch() {
            const pending = [];
            return {
                update(ref, data, precondition) {
                    writes.push({ id: ref.id, data, precondition });
                    pending.push({ id: ref.id, data });
                },
                async commit() {
                    if (conflict) throw Object.assign(new Error('Document changed'), { code: 9 });
                    committed.push(...pending);
                },
            };
        },
    };
}

test('idle campus uses three empty queries and never scans seeded places', async () => {
    const db = database({ places: Array.from({ length: 36 }, (_, n) => ({
        id: `place-${n}`, busyPercent: 0, lastUpdate: null,
    })) });
    const result = await aggregatePlaceCrowds(db, now);
    assert.equal(result.candidatePlaces, 0);
    assert.equal(result.estimatedDocumentReads, 3);
    assert.equal(db.requests.length, 3);
    assert.equal(db.writes.length, 0);
});

test('a first check-in fetches its place and publishes a crowd level', async () => {
    const db = database({
        places: [{ id: 'library', busyPercent: 0, lastUpdate: null }],
        reports: [{ placeId: 'library', level: 3, timestamp: atAge(5) }],
    });
    const result = await aggregatePlaceCrowds(db, now);
    assert.equal(result.updatedPlaces, 1);
    assert.deepEqual(db.requests[3].getAll, ['library']);
    assert.equal(db.committed[0].data.busyPercent, 100);
    assert.equal(db.committed[0].data.lastUpdate.toMillis(), atAge(5).toMillis());
});

test('expired state resets even when recent check-ins are empty', async () => {
    const db = database({ places: [{ id: 'gym', busyPercent: 100, lastUpdate: atAge(100) }] });
    await aggregatePlaceCrowds(db, now);
    assert.equal(db.committed.length, 1);
    assert.equal(db.committed[0].data.busyPercent, 0);
    assert.ok(db.committed[0].data.lastUpdate.isEqual(FieldValue.delete()));
});

test('zero-percent reports still have their expired timestamp cleared', async () => {
    const db = database({ places: [{ id: 'gym', busyPercent: 0, lastUpdate: atAge(100) }] });
    await aggregatePlaceCrowds(db, now);
    assert.equal(db.committed.length, 1);
    assert.ok(db.committed[0].data.lastUpdate.isEqual(FieldValue.delete()));
});

test('legacy nonzero state with no timestamp is reset', async () => {
    const db = database({ places: [{ id: 'gym', busyPercent: 50 }] });
    await aggregatePlaceCrowds(db, now);
    assert.equal(db.committed[0].data.busyPercent, 0);
});

test('unchanged values and active admin overrides produce no writes', async () => {
    const db = database({
        places: [
            { id: 'library', busyPercent: 100, lastUpdate: atAge(5) },
            { id: 'gym', busyPercent: 50, adminOverride: { active: true } },
        ],
        reports: [{ placeId: 'library', level: 3, timestamp: atAge(5) }],
    });
    await aggregatePlaceCrowds(db, now);
    assert.equal(db.writes.length, 0);
    assert.equal(db.requests.length, 3); // Existing candidates are not fetched again.
});

test('a concurrent admin edit fails the write so the scheduler can retry', async () => {
    const db = database({ places: [{ id: 'gym', busyPercent: 100, lastUpdate: atAge(100) }], conflict: true });
    await assert.rejects(aggregatePlaceCrowds(db, now), /Document changed/);
    assert.equal(db.writes[0].precondition.lastUpdateTime.toMillis(), atAge(1).toMillis());
    assert.equal(db.committed.length, 0);
});

test('more than 500 changed places use multiple bounded write batches', async () => {
    const db = database({ places: Array.from({ length: 501 }, (_, n) => ({
        id: `place-${n}`, busyPercent: 100, lastUpdate: atAge(100),
    })) });
    const result = await aggregatePlaceCrowds(db, now);
    assert.equal(result.updatedPlaces, 501);
    assert.equal(db.committed.length, 501);
});

test('deleted places referenced by reports are skipped', async () => {
    const db = database({ reports: [{ placeId: 'missing', level: 3, timestamp: atAge(5) }] });
    const result = await aggregatePlaceCrowds(db, now);
    assert.equal(result.updatedPlaces, 0);
});

test('crowd weights and the 90-minute window are preserved', () => {
    assert.equal(calculateBusyPercent([
        { level: 1, timestamp: atAge(30) },
        { level: 3, timestamp: atAge(0) },
        { level: 3, timestamp: atAge(91) },
    ], now), 67);
    assert.equal(calculateBusyPercent([{ level: 3, timestamp: atAge(90) }], now), 100);
    assert.equal(calculateBusyPercent([{ level: 3, timestamp: atAge(91) }], now), 0);
});

test('server GPS checks reject invalid, inaccurate, and distant locations', () => {
    assert.throws(() => parseClientLocation({ latitude: 91, longitude: 0, accuracy: 5 }));
    assert.throws(() => parseClientLocation({ latitude: 40, longitude: -75, accuracy: 31 }));
    const point = parseClientLocation({ latitude: 40, longitude: -75, accuracy: 5 });
    assert.doesNotThrow(() => validateCheckinLocation(point, point));
    assert.throws(() => validateCheckinLocation(point, { latitude: 41, longitude: -75 }));
});
