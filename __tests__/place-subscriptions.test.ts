import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AppState, type AppStateStatus } from 'react-native';
import { onSnapshot } from 'firebase/firestore';
import { subscribePlace, subscribePlaces } from '@/services/place-subscriptions';

jest.mock('react-native', () => Object.defineProperty(
    Object.create(jest.requireActual('react-native') as object),
    'AppState',
    { value: { currentState: 'active', addEventListener: jest.fn() } }
));
jest.mock('@/config/firebase-client', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn((_db, name) => ({ kind: 'collection', id: name })),
    doc: jest.fn((_db, _collection, id) => ({ kind: 'document', id })),
    onSnapshot: jest.fn(),
}));
jest.mock('@/services/place-document-mapper', () => ({
    mapPlaceDocument: (id: string, data: object) => ({ id, ...data }),
}));

type Stream = {
    ref: { kind: string; id: string };
    next: (snapshot: object) => void;
    error: (error: Error) => void;
    stop: ReturnType<typeof jest.fn>;
};
let streams: Stream[];
let stateChanged: ((state: AppStateStatus) => void) | null;
let releases: (() => void)[];

beforeEach(() => {
    jest.clearAllMocks();
    streams = [];
    releases = [];
    stateChanged = null;
    AppState.currentState = 'active';
    jest.mocked(onSnapshot).mockImplementation((...args: unknown[]) => {
        const stream = {
            ref: args[0] as Stream['ref'],
            next: args[1] as Stream['next'],
            error: args[2] as Stream['error'],
            stop: jest.fn(),
        };
        streams.push(stream);
        return stream.stop;
    });
    jest.mocked(AppState.addEventListener).mockImplementation((_event, callback) => {
        stateChanged = callback;
        return { remove: jest.fn(() => { stateChanged = null; }) };
    });
});

afterEach(() => {
    releases.forEach((release) => release());
});

function changeState(state: AppStateStatus) {
    AppState.currentState = state;
    stateChanged?.(state);
}

function publishCollection(stream: Stream, busyPercent: number) {
    stream.next({ docs: [{ id: 'library', data: () => ({ busyPercent }) }] });
}

describe('shared place subscriptions', () => {
    it('map and detail receive the same stream without a second database listener', () => {
        const map = jest.fn();
        const detail = jest.fn();
        releases.push(subscribePlaces(map));
        publishCollection(streams[0], 50);
        releases.push(subscribePlace('library', detail));
        expect(streams).toHaveLength(1);
        expect(detail).toHaveBeenLastCalledWith({ id: 'library', busyPercent: 50 });
        publishCollection(streams[0], 100);
        expect(detail).toHaveBeenLastCalledWith({ id: 'library', busyPercent: 100 });
        expect(map).toHaveBeenLastCalledWith([{ id: 'library', busyPercent: 100 }]);
    });

    it('a direct link only fetches its document and shares it with another detail consumer', () => {
        const first = subscribePlace('library', jest.fn());
        releases.push(first, subscribePlace('library', jest.fn()));
        expect(streams).toHaveLength(1);
        expect(streams[0].ref).toEqual({ kind: 'document', id: 'library' });
        first();
        expect(streams[0].stop).not.toHaveBeenCalled();
    });

    it('switches from a document to the collection and back as screens mount and unmount', () => {
        const detail = jest.fn();
        releases.push(subscribePlace('library', detail));
        const releaseMap = subscribePlaces(jest.fn());
        releases.push(releaseMap);
        expect(streams[0].stop).toHaveBeenCalledTimes(1);
        expect(streams[1].ref.kind).toBe('collection');
        publishCollection(streams[1], 50);
        releaseMap();
        expect(streams[1].stop).toHaveBeenCalledTimes(1);
        expect(streams[2].ref.kind).toBe('document');
        streams[2].next({ id: 'library', exists: () => true, data: () => ({ busyPercent: 100 }) });
        expect(detail).toHaveBeenLastCalledWith({ id: 'library', busyPercent: 100 });
    });

    it('pauses in the background and resumes once for all screens', () => {
        releases.push(subscribePlaces(jest.fn()), subscribePlace('library', jest.fn()));
        changeState('inactive');
        expect(streams[0].stop).not.toHaveBeenCalled();
        changeState('background');
        expect(streams[0].stop).toHaveBeenCalledTimes(1);
        releases.push(subscribePlace('gym', jest.fn()));
        expect(streams).toHaveLength(1);
        changeState('active');
        expect(streams).toHaveLength(2);
        expect(streams[1].ref.kind).toBe('collection');
    });

    it('starts no database listener if a screen subscribes while backgrounded', () => {
        AppState.currentState = 'background';
        releases.push(subscribePlace('library', jest.fn()));
        expect(streams).toHaveLength(0);
        changeState('active');
        expect(streams).toHaveLength(1);
    });

    it('reports deleted places as null', () => {
        const detail = jest.fn();
        releases.push(subscribePlace('library', detail));
        streams[0].next({ exists: () => false });
        expect(detail).toHaveBeenLastCalledWith(null);
    });

    it('propagates collection errors and restarts after a foreground transition', () => {
        const error = jest.fn();
        releases.push(subscribePlaces(jest.fn(), error), subscribePlace('library', jest.fn(), error));
        const failure = new Error('Permission denied');
        streams[0].error(failure);
        expect(error).toHaveBeenCalledTimes(2);
        changeState('background');
        changeState('active');
        expect(streams).toHaveLength(2);
    });
});
