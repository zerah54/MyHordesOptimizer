import { NO_CONSTRAINT } from './attack-refiner.service';

/**
 * Rejeu CPU (f64 exact) des actions MyHordes, pour re-vérifier les seeds candidats du GPU et en
 * dériver la plage de valeurs d'attaque. Le CPU dispose du f64 → pas besoin du « fork » du shader :
 * la trajectoire est calculée exactement. Voir le service pour le modèle.
 */

const SHIFT: number = 10;
const SPREAD: number = 10;

/** Port exact de mt_rand PHP (MT19937 mode MT_RAND_MT19937 + php_random_range32). */
export class PhpMt {
    private readonly s: Uint32Array = new Uint32Array(624);
    private count: number = 624;

    private static twist(m: number, u: number, v: number): number {
        const mix: number = ((u & 0x80000000) | (v & 0x7fffffff)) >>> 0;
        return (m ^ (mix >>> 1) ^ ((v & 1) ? 0x9908b0df : 0)) >>> 0;
    }

    public seed(seed: number): void {
        this.s[0] = seed >>> 0;
        for (let i: number = 1; i < 624; i++) {
            const prev: number = this.s[i - 1];
            this.s[i] = (Math.imul(1812433253, prev ^ (prev >>> 30)) + i) >>> 0;
        }
        this.count = 624;
    }

    public rand(min: number, max: number): number {
        const range: number = max - min;
        if (range === 0) {
            return min;
        }
        return min + this.range32(range >>> 0);
    }

    private reload(): void {
        const n: number = 624;
        const m: number = 397;
        let p: number = 0;
        for (let i: number = 0; i < n - m; i++, p++) {
            this.s[p] = PhpMt.twist(this.s[p + m], this.s[p], this.s[p + 1]);
        }
        for (let i: number = 0; i < m - 1; i++, p++) {
            this.s[p] = PhpMt.twist(this.s[p + m - n], this.s[p], this.s[p + 1]);
        }
        this.s[p] = PhpMt.twist(this.s[p + m - n], this.s[p], this.s[0]);
        this.count = 0;
    }

    private next(): number {
        if (this.count >= 624) {
            this.reload();
        }
        let s1: number = this.s[this.count++];
        s1 ^= s1 >>> 11;
        s1 = (s1 ^ ((s1 << 7) & 0x9d2c5680)) >>> 0;
        s1 = (s1 ^ ((s1 << 15) & 0xefc60000)) >>> 0;
        s1 = (s1 ^ (s1 >>> 18)) >>> 0;
        return s1;
    }

    private range32(umax: number): number {
        let result: number = this.next();
        if (umax === 0xFFFFFFFF) {
            return result;
        }
        const um: number = (umax + 1) >>> 0;
        if ((um & (um - 1)) === 0) {
            return result & (um - 1);
        }
        const limit: number = (0xFFFFFFFF - (0xFFFFFFFF % um) - 1) >>> 0;
        while (result > limit) {
            result = this.next();
        }
        return result % um;
    }
}

function chance(mt: PhpMt, c: number): boolean {
    if (c >= 1) {
        return true;
    }
    if (c <= 0) {
        return false;
    }
    return mt.rand(0, 99) < 100 * c;
}

/** Trajectoire d'offsets [offMin_q, offMax_q] pour q=0..24 (base + seed), en f64 exact. */
function offsetTrajectory(mt: PhpMt, offMinBase: number, offMaxBase: number, seed: number): [number, number][] {
    let oMin: number = offMinBase;
    let oMax: number = offMaxBase;
    mt.seed(seed);
    const traj: [number, number][] = [[oMin, oMax]];
    const minSpread: number = SPREAD - SHIFT;
    for (let i: number = 0; i < 24; i++) {
        const spendable: number = (Math.max(0, oMin) + Math.max(0, oMax)) / (24 - i);
        const calcNext: () => number = (): number => mt.rand(Math.floor(spendable * 250), Math.floor(spendable * 1000)) / 1000.0;
        if (oMin + oMax > minSpread) {
            const incMin: boolean = chance(mt, oMin / (oMin + oMax));
            const alter: number = calcNext();
            if (chance(mt, 0.25)) {
                const alterMax: number = calcNext();
                oMin = Math.max(0, oMin - alter);
                oMax = Math.max(0, oMax - alterMax);
            } else if (incMin && oMin > 0) {
                oMin = Math.max(0, oMin - alter);
            } else {
                oMax = Math.max(0, oMax - alter);
            }
        }
        traj.push([oMin, oMax]);
    }
    return traj;
}

/**
 * Re-vérifie les seeds candidats en f64 exact et dérive la plage de valeurs d'attaque.
 *
 * @param observed 50 entiers (min[0..24], max[0..24], NO_CONSTRAINT si non saisi).
 * @param hits Seeds candidats du GPU.
 * @returns Valeurs d'attaque compatibles, triées et dédupliquées (vide si aucun hit valide).
 */
export function deriveValueRange(observed: Int32Array, hits: number[]): number[] {
    const mt: PhpMt = new PhpMt();
    const values: Set<number> = new Set<number>();
    const shiftSpan: number = SHIFT / 100;
    for (const seed of hits) {
        for (let base: number = 5; base <= 26; base++) {
            const traj: [number, number][] = offsetTrajectory(mt, base, 28 - base, seed);
            let tMinLo: number = 1;
            let tMinHi: number = 1e9;
            let tMaxLo: number = 1;
            let tMaxHi: number = 1e9;
            let ok: boolean = true;
            for (let q: number = 0; q <= 24; q++) {
                const obMin: number = observed[q];
                const obMax: number = observed[25 + q];
                if (obMin !== NO_CONSTRAINT) {
                    const fMin: number = 1 - traj[q][0] / 100;
                    tMinLo = Math.max(tMinLo, (obMin - 0.5) / fMin);
                    tMinHi = Math.min(tMinHi, (obMin + 0.5) / fMin);
                }
                if (obMax !== NO_CONSTRAINT) {
                    const fMax: number = 1 + traj[q][1] / 100;
                    tMaxLo = Math.max(tMaxLo, (obMax - 0.5) / fMax);
                    tMaxHi = Math.min(tMaxHi, (obMax + 0.5) / fMax);
                }
                if (Math.ceil(tMinLo) > Math.floor(tMinHi) || Math.ceil(tMaxLo) > Math.floor(tMaxHi)) {
                    ok = false;
                    break;
                }
            }
            if (!ok) {
                continue;
            }
            for (let tMin: number = Math.ceil(tMinLo); tMin <= Math.floor(tMinHi); tMin++) {
                for (let tMax: number = Math.ceil(tMaxLo); tMax <= Math.floor(tMaxHi); tMax++) {
                    values.add(Math.round((tMax - tMin) / shiftSpan));
                }
            }
        }
    }
    return [...values].sort((a: number, b: number): number => a - b);
}
