import { beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { addItemToWishlist } from './wishlist';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn(), addSuccess: vi.fn() }));

const fetcherMock = fetcher as unknown as ReturnType<typeof vi.fn>;

function textResponse(status: number): Response {
    return { status, text: () => Promise.resolve('') } as unknown as Response;
}

function jsonResponse(status: number, body: unknown): Response {
    return { status, json: () => Promise.resolve(body) } as unknown as Response;
}

beforeEach(() => {
    fetcherMock.mockReset();
    state.api_url = 'https://api.test';
    state.mh_user = { id: 7, townDetails: { townId: 12 } } as any;
    state.wishlist = undefined;
});

describe('addItemToWishlist', () => {
    it('refetches state.wishlist after a successful add, so an addition made through a different item reference than the one tracked in state.items/state.wishlist is still reflected', async () => {
        const posted_item = { id: 42, wishListCount: 0 };
        const server_wishlist_after_add = {
            wishList: [{ item: { id: 42 }, count: 1, bankCount: 0, bagCount: 0, depot: 0, priority: 0, zoneXPa: 0, isWorkshop: false, shouldSignal: false }]
        };

        fetcherMock.mockImplementation((_url: string, options?: { method?: string }) => {
            if (options?.method === 'POST') return Promise.resolve(textResponse(200));
            return Promise.resolve(jsonResponse(200, server_wishlist_after_add));
        });

        await addItemToWishlist(posted_item);
        // getWishlist() is fired without being awaited by addItemToWishlist: let its microtasks flush.
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(state.wishlist?.wishList?.some((entry) => entry.item.id === 42)).toBe(true);
    });
});
