import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { httpsCallable } from 'firebase/functions';
import { checkIsAdmin } from '@/services/admin-service';

jest.mock('@/config/firebase-client', () => ({ db: {}, functions: {} }));
jest.mock('@/services/auth-service', () => ({ getCurrentUserUID: () => 'test-user' }));
jest.mock('firebase/functions', () => ({ httpsCallable: jest.fn() }));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(), updateDoc: jest.fn(), deleteField: jest.fn(), serverTimestamp: jest.fn(),
}));

let clock = 1_000_000;
let request: ReturnType<typeof jest.fn<() => Promise<{ data: { isAdmin: boolean } }>>>;

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockImplementation(() => clock);
    request = jest.fn<() => Promise<{ data: { isAdmin: boolean } }>>()
        .mockResolvedValue({ data: { isAdmin: true } });
    jest.mocked(httpsCallable).mockReturnValue(request as unknown as ReturnType<typeof httpsCallable>);
});

afterEach(() => { jest.restoreAllMocks(); });

describe('admin permission hints', () => {
    it('coalesces concurrent lookups and caches repeated visits', async () => {
        const results = await Promise.all([
            checkIsAdmin('cached-user'), checkIsAdmin('cached-user'), checkIsAdmin('cached-user'),
        ]);
        expect(results).toEqual([true, true, true]);
        expect(await checkIsAdmin('cached-user')).toBe(true);
        expect(request).toHaveBeenCalledTimes(1);
    });

    it('refreshes permissions after five minutes', async () => {
        await checkIsAdmin('expiry-user');
        clock += 5 * 60_000 + 1;
        request.mockResolvedValue({ data: { isAdmin: false } });
        expect(await checkIsAdmin('expiry-user')).toBe(false);
        expect(request).toHaveBeenCalledTimes(2);
    });

    it('does not share one user’s cached permission with another user', async () => {
        await checkIsAdmin('admin-user');
        request.mockResolvedValue({ data: { isAdmin: false } });
        expect(await checkIsAdmin('student-user')).toBe(false);
        expect(request).toHaveBeenCalledTimes(2);
    });

    it('retries a failed lookup instead of caching the failure as a denial', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        request.mockRejectedValueOnce(new Error('Offline'));
        expect(await checkIsAdmin('offline-user')).toBe(false);
        expect(await checkIsAdmin('offline-user')).toBe(true);
        expect(request).toHaveBeenCalledTimes(2);
    });
});
