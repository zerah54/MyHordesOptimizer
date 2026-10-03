import { CornerLayouts, DEFAULT_CORNERS, sanitizeCorners } from './map-corners';

describe('sanitizeCorners', (): void => {
    it('returns the default layouts when nothing is stored', (): void => {
        expect(sanitizeCorners(undefined)).toEqual(DEFAULT_CORNERS);
        expect(sanitizeCorners(null)).toEqual(DEFAULT_CORNERS);
        expect(sanitizeCorners('corrompu')).toEqual(DEFAULT_CORNERS);
    });

    it('returns a copy, never the shared defaults', (): void => {
        const layouts: CornerLayouts = sanitizeCorners(undefined);

        expect(layouts).not.toBe(DEFAULT_CORNERS);
        expect(layouts.digs).not.toBe(DEFAULT_CORNERS.digs);
    });

    it('keeps the stored choices and fills a missing map type or corner with its default', (): void => {
        const layouts: CornerLayouts = sanitizeCorners({ danger: { top_left: 'distance_km' } });

        expect(layouts.danger.top_left).toBe('distance_km');
        expect(layouts.danger.bottom_right).toBe(DEFAULT_CORNERS.danger.bottom_right);
        expect(layouts.digs).toEqual(DEFAULT_CORNERS.digs);
    });

    it('moves a layout saved before version 2 and left at the former exploration default to the new default', (): void => {
        const former: unknown = { scout: { top_left: 'note', top_right: 'citizens', bottom_left: 'ruin_digs', bottom_right: 'none' } };

        expect(sanitizeCorners(former, 1).scout).toEqual(DEFAULT_CORNERS.scout);
        expect(DEFAULT_CORNERS.scout.bottom_right).toBe('zombies');
        // Choisie après la version 2, la même disposition est respectée.
        expect(sanitizeCorners(former, 2).scout.bottom_right).toBe('none');
        // Modifiée avant la version 2, elle l'est aussi.
        expect(sanitizeCorners({ scout: { bottom_right: 'none', top_left: 'items' } }, 1).scout.bottom_right).toBe('none');
    });

    it('replaces an unknown information with the default of its corner', (): void => {
        const layouts: CornerLayouts = sanitizeCorners({ digs: { bottom_right: 'retirée', top_left: 42 } });

        expect(layouts.digs.bottom_right).toBe(DEFAULT_CORNERS.digs.bottom_right);
        expect(layouts.digs.top_left).toBe(DEFAULT_CORNERS.digs.top_left);
    });
});
