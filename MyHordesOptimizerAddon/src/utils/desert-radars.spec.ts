import { afterEach, describe, expect, it } from 'vitest';

import type { ScavNextCells, ScoutNextCells } from './desert-radars';
import { getScavNextCells, getScoutNextCells } from './desert-radars';

afterEach(() => {
    document.body.innerHTML = '';
});

describe('getScavNextCells', () => {
    it('vaut true pour une case voisine épuisée et false pour une case encore fouillable', () => {
        document.body.innerHTML = '<div class="scavenger-sense scavenger-sense-north scavenger-sense-1"></div>'
            + '<div class="scavenger-sense scavenger-sense-east scavenger-sense-0"></div>';

        const radar: ScavNextCells = getScavNextCells();

        expect(radar.north).toBe(false);
        expect(radar.east).toBe(true);
    });

    it('laisse indéfinie une direction absente de la page', () => {
        document.body.innerHTML = '<div class="scavenger-sense scavenger-sense-north scavenger-sense-1"></div>';

        const radar: ScavNextCells = getScavNextCells();

        expect(radar.south).toBeUndefined();
        expect(radar.west).toBeUndefined();
        expect('south' in JSON.parse(JSON.stringify(radar))).toBe(false);
    });
});

describe('getScoutNextCells', () => {
    it('lit l\'estimation de zombies de chaque direction présente', () => {
        document.body.innerHTML = '<div class="scout-sense scout-sense-north"><svg><text>7</text></svg></div>'
            + '<div class="scout-sense scout-sense-west"><svg><text>0</text></svg></div>';

        const radar: ScoutNextCells = getScoutNextCells();

        expect(radar.north).toBe(7);
        expect(radar.west).toBe(0);
        expect(radar.east).toBeUndefined();
        expect(radar.south).toBeUndefined();
    });
});
