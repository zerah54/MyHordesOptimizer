import {
    CORNER_INFO_OPTIONS,
    cornerIcon,
    CornerInfoOption,
    CornerLayouts,
    DEFAULT_CORNERS,
    DIG_LEVEL_ICONS,
    sanitizeCorners,
    SCOUT_LEVEL_ICONS,
    updateAgeTone
} from './map-corners';

const DAY_MINUTES: number = 24 * 60;

describe('updateAgeTone', (): void => {
    it('is green under a day, yellow from 1 to under 2 days, orange from 2 to under 3 days, red from 3 days', (): void => {
        expect(updateAgeTone(0)).toBe('green');
        expect(updateAgeTone(DAY_MINUTES - 1)).toBe('green');
        expect(updateAgeTone(DAY_MINUTES)).toBe('yellow');
        expect(updateAgeTone(2 * DAY_MINUTES - 1)).toBe('yellow');
        expect(updateAgeTone(2 * DAY_MINUTES)).toBe('orange');
        expect(updateAgeTone(3 * DAY_MINUTES - 1)).toBe('orange');
        expect(updateAgeTone(3 * DAY_MINUTES)).toBe('red');
        expect(updateAgeTone(10 * DAY_MINUTES)).toBe('red');
    });
});

describe('level icons', (): void => {
    it('uses the in-game icons of the dig level, from depleted (0) to abundant (3)', (): void => {
        expect(DIG_LEVEL_ICONS).toEqual(['icons/Small_broken.gif', 'icons/collec_lv1.gif', 'icons/collec_lv2.gif', 'icons/collec_lv3.gif']);
    });

    it('uses the in-game icons of the scout level, from 0 to 3', (): void => {
        expect(SCOUT_LEVEL_ICONS).toEqual(['icons/scout_lv0.gif', 'icons/scout_lv1.gif', 'icons/scout_lv2.gif', 'icons/scout_lv3.gif']);
    });

    it('offers the dig and scout levels as corner information, each with a representative icon', (): void => {
        const values: string[] = CORNER_INFO_OPTIONS.map((option: CornerInfoOption): string => option.value);

        expect(values).toContain('digs_level');
        expect(values).toContain('scout_level');
        expect(cornerIcon('digs_level', 'fr')).toBe('icons/collec_lv3.gif');
        expect(cornerIcon('scout_level', 'fr')).toBe('icons/scout_lv3.gif');
    });

    it('shows the update age as a sample dot rather than a text', (): void => {
        const age: CornerInfoOption | undefined = CORNER_INFO_OPTIONS.find((option: CornerInfoOption): boolean => option.value === 'update_age');

        expect(age?.tone).toBe('green');
        expect(age?.sample).toBeUndefined();
        expect(cornerIcon('update_age', 'fr')).toBeNull();
    });
});

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

    it('keeps the dig level and scout level choices', (): void => {
        const layouts: CornerLayouts = sanitizeCorners({ scout: { bottom_left: 'digs_level', bottom_right: 'scout_level' } });

        expect(layouts.scout.bottom_left).toBe('digs_level');
        expect(layouts.scout.bottom_right).toBe('scout_level');
    });

    it('replaces an unknown information with the default of its corner', (): void => {
        const layouts: CornerLayouts = sanitizeCorners({ digs: { bottom_right: 'retirée', top_left: 42 } });

        expect(layouts.digs.bottom_right).toBe(DEFAULT_CORNERS.digs.bottom_right);
        expect(layouts.digs.top_left).toBe(DEFAULT_CORNERS.digs.top_left);
    });
});
