/**
 * Minesweeper solvable grid generator
 * Ported from Simon Tatham's Puzzles - mines.c
 * https://github.com/ghewgill/puzzles/blob/master/mines.c
 */
export class SeededRng {
    private state: number;

    constructor(seed: number) {
        this.state = seed >>> 0;
    }

    /** Returns an integer in [0, n) */
    public upto(n: number): number {
        return Math.floor(this.next() * n);
    }

    /** Returns a 31-bit positive integer */
    public bits31(): number {
        return Math.floor(this.next() * 0x80000000);
    }

    /** Returns a float in [0, 1) */
    private next(): number {
        this.state = (this.state + 0x6D2B79F5) >>> 0;
        let z: number = this.state;
        z = Math.imul(z ^ (z >>> 15), z | 1) >>> 0;
        z ^= z + Math.imul(z ^ (z >>> 7), z | 61) >>> 0;
        z = ((z ^ (z >>> 14)) >>> 0);
        return z / 0x100000000;
    }
}

interface MineSet {
    x: number;
    y: number;
    mask: number;
    mines: number;
    in_todo: boolean;
    prev: MineSet | null;
    next: MineSet | null;
}

class SetStore {
    private sets: Map<string, MineSet> = new Map();
    private todo_head: MineSet | null = null;
    private todo_tail: MineSet | null = null;

    public add(x: number, y: number, mask: number, mines: number): void {
        if (mask === 0) return;

        // Normalise: shift so x,y are the true top-left corner
        while (!(mask & (1 | 8 | 64))) {
            mask >>= 1;
            x++;
        }
        while (!(mask & (1 | 2 | 4))) {
            mask >>= 3;
            y++;
        }

        const k = this.key(x, y, mask);
        if (this.sets.has(k)) return; // already exists

        const s: MineSet = {x, y, mask, mines, in_todo: false, prev: null, next: null};
        this.sets.set(k, s);
        this.addToTodo(s);
    }

    public remove(s: MineSet): void {
        // Unlink from todo list
        if (s.prev) s.prev.next = s.next;
        else if (s === this.todo_head) this.todo_head = s.next;
        if (s.next) s.next.prev = s.prev;
        else if (s === this.todo_tail) this.todo_tail = s.prev;
        s.in_todo = false;

        this.sets.delete(this.key(s.x, s.y, s.mask));
    }

    public popTodo(): MineSet | null {
        if (!this.todo_head) return null;
        const s: MineSet = this.todo_head;
        this.todo_head = s.next;
        if (this.todo_head) this.todo_head.prev = null;
        else this.todo_tail = null;
        s.next = s.prev = null;
        s.in_todo = false;
        return s;
    }

    /** All sets whose 3×3 window overlaps the 3×3 window of (x, y, mask) */
    public overlapping(x: number, y: number, mask: number): MineSet[] {
        const result: MineSet[] = [];
        for (const s of this.sets.values()) {
            if (setmunge(x, y, mask, s.x, s.y, s.mask, false) !== 0) {
                result.push(s);
            }
        }
        return result;
    }

    public allSets(): MineSet[] {
        return Array.from(this.sets.values());
    }

    private key(x: number, y: number, mask: number): string {
        return `${x},${y},${mask}`;
    }

    private addToTodo(s: MineSet): void {
        if (s.in_todo) return;
        s.prev = this.todo_tail;
        if (s.prev) s.prev.next = s;
        else this.todo_head = s;
        this.todo_tail = s;
        s.next = null;
        s.in_todo = true;
    }
}

function bitcount16(word: number): number {
    word = ((word & 0xAAAA) >>> 1) + (word & 0x5555);
    word = ((word & 0xCCCC) >>> 2) + (word & 0x3333);
    word = ((word & 0xF0F0) >>> 4) + (word & 0x0F0F);
    word = ((word & 0xFF00) >>> 8) + (word & 0x00FF);
    return word;
}

/**
 * Compute the intersection (diff=false) or difference (diff=true) of two
 * 3×3 bitmasks anchored at different (x,y) positions.
 * Returns the new mask for set 1.
 */
function setmunge(x1: number, y1: number, mask1: number,
                  x2: number, y2: number, mask2: number,
                  diff: boolean): number {
    if (Math.abs(x2 - x1) >= 3 || Math.abs(y2 - y1) >= 3) {
        mask2 = 0;
    } else {
        while (x2 > x1) {
            mask2 &= ~(4 | 32 | 256);
            mask2 <<= 1;
            x2--;
        }
        while (x2 < x1) {
            mask2 &= ~(1 | 8 | 64);
            mask2 >>= 1;
            x2++;
        }
        while (y2 > y1) {
            mask2 &= ~(64 | 128 | 256);
            mask2 <<= 3;
            y2--;
        }
        while (y2 < y1) {
            mask2 &= ~(1 | 2 | 4);
            mask2 >>= 3;
            y2++;
        }
    }
    if (diff) mask2 ^= 511;
    return mask1 & mask2;
}

class SquareTodo {
    private next: Int32Array;
    private head: number = -1;
    private tail: number = -1;

    constructor(size: number) {
        this.next = new Int32Array(size).fill(-1);
    }

    public push(i: number): void {
        if (this.tail >= 0) this.next[this.tail] = i;
        else this.head = i;
        this.tail = i;
        this.next[i] = -1;
    }

    public pop(): number {
        if (this.head === -1) return -1;
        const i: number = this.head;
        this.head = this.next[i];
        if (this.head === -1) this.tail = -1;
        return i;
    }
}

/** grid values: 0-8 = open with N adjacent mines, -1 = known mine, -2 = unknown */
const UNKNOWN: number = -2;
const KNOWN_MINE: number = -1;

type OpenFn = (x: number, y: number) => number;   // returns adjacent mine count, or -1 if mine
type PerturbFn = (grid: Int8Array, setx: number, sety: number, mask: number) => Perturbation[] | null;

interface Perturbation {
    x: number;
    y: number;
    delta: number; // +1 = became a mine, -1 = cleared
}

function knownSquares(
    width: number,
    square_todo: SquareTodo,
    grid: Int8Array,
    open: OpenFn,
    x: number, y: number, mask: number,
    mine: boolean
): void {
    let bit: number = 1;
    for (let yy: number = 0; yy < 3; yy++) {
        for (let xx: number = 0; xx < 3; xx++) {
            if (mask & bit) {
                const i: number = (y + yy) * width + (x + xx);
                if (grid[i] === UNKNOWN) {
                    if (mine) {
                        grid[i] = KNOWN_MINE;
                    } else {
                        grid[i] = open(x + xx, y + yy) as number;
                    }
                    square_todo.push(i);
                }
            }
            bit <<= 1;
        }
    }
}

function minesolve(
    width: number, height: number, nb_mines: number,
    grid: Int8Array,
    open: OpenFn,
    perturb: PerturbFn | null,
    rng: SeededRng
): number {
    const set_store: SetStore = new SetStore();
    const square_todo: SquareTodo = new SquareTodo(width * height);
    let nperturbs: number = 0;

    for (let i: number = 0; i < width * height; i++) {
        if (grid[i] !== UNKNOWN) square_todo.push(i);
    }

    while (true) {
        let done_something: boolean = false;

        let i: number;
        while ((i = square_todo.pop()) !== -1) {
            const x: number = i % width;
            const y: number = (i / width) | 0;

            if (grid[i] >= 0) {
                let mines: number = grid[i];
                let val: number = 0;
                let bit: number = 1;
                for (let dy: number = -1; dy <= 1; dy++) {
                    for (let dx: number = -1; dx <= 1; dx++) {
                        if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) {
                            /* out of bounds — skip */
                        } else if (grid[(y + dy) * width + (x + dx)] === KNOWN_MINE) {
                            mines--;
                        } else if (grid[(y + dy) * width + (x + dx)] === UNKNOWN) {
                            val |= bit;
                        }
                        bit <<= 1;
                    }
                }
                if (val) set_store.add(x - 1, y - 1, val, mines);
            }

            const overlaps: MineSet[] = set_store.overlapping(x, y, 1);
            for (const s of overlaps) {
                const new_mask: number = setmunge(s.x, s.y, s.mask, x, y, 1, true);
                const new_mines: number = s.mines - (grid[i] === KNOWN_MINE ? 1 : 0);
                if (new_mask) set_store.add(s.x, s.y, new_mask, new_mines);
                set_store.remove(s);
            }

            done_something = true;
        }

        const s: MineSet | null = set_store.popTodo();
        if (s !== null) {
            const cardinality: number = bitcount16(s.mask);

            if (s.mines === 0 || s.mines === cardinality) {
                knownSquares(width, square_todo, grid, open, s.x, s.y, s.mask, s.mines !== 0);
                continue;
            }

            const overlaps: MineSet[] = set_store.overlapping(s.x, s.y, s.mask);
            for (const s2 of overlaps) {
                const swing: number = setmunge(s.x, s.y, s.mask, s2.x, s2.y, s2.mask, true);
                const s2wing: number = setmunge(s2.x, s2.y, s2.mask, s.x, s.y, s.mask, true);
                const swc: number = bitcount16(swing);
                const s2wc: number = bitcount16(s2wing);

                if (swc === s.mines - s2.mines || s2wc === s2.mines - s.mines) {
                    knownSquares(width, square_todo, grid, open, s.x, s.y, swing, swc === s.mines - s2.mines);
                    knownSquares(width, square_todo, grid, open, s2.x, s2.y, s2wing, s2wc === s2.mines - s.mines);
                    continue;
                }

                if (swc === 0 && s2wc !== 0) {
                    set_store.add(s2.x, s2.y, s2wing, s2.mines - s.mines);
                } else if (s2wc === 0 && swc !== 0) {
                    set_store.add(s.x, s.y, swing, s.mines - s2.mines);
                }
            }

            done_something = true;

        } else if (nb_mines >= 0) {
            let squares_left: number = 0;
            let mines_left: number = nb_mines;
            for (let j: number = 0; j < width * height; j++) {
                if (grid[j] === KNOWN_MINE) mines_left--;
                else if (grid[j] === UNKNOWN) squares_left++;
            }

            if (squares_left === 0) break; // done!

            if (mines_left === 0 || mines_left === squares_left) {
                for (let j: number = 0; j < width * height; j++) {
                    if (grid[j] === UNKNOWN) {
                        knownSquares(width, square_todo, grid, open, j % width, (j / width) | 0, 1, mines_left !== 0);
                    }
                }
                continue;
            }

            const all_sets: MineSet[] = set_store.allSets();
            const nsets: number = all_sets.length;
            if (nsets > 0 && nsets <= 10) {
                const setused = new Int32Array(nsets);
                let cursor: number = 0;
                let sq_left: number = squares_left;
                let mn_left: number = mines_left;

                while (true) {
                    if (cursor < nsets) {
                        let ok: boolean = true;
                        for (let j: number = 0; j < cursor; j++) {
                            if (setused[j] &&
                                setmunge(all_sets[cursor].x, all_sets[cursor].y, all_sets[cursor].mask,
                                    all_sets[j].x, all_sets[j].y, all_sets[j].mask, false)) {
                                ok = false;
                                break;
                            }
                        }
                        if (ok) {
                            mn_left -= all_sets[cursor].mines;
                            sq_left -= bitcount16(all_sets[cursor].mask);
                        }
                        setused[cursor++] = ok ? 1 : 0;
                    } else {
                        if (sq_left > 0 && (mn_left === 0 || mn_left === sq_left)) {
                            // All squares outside the union are either all safe or all mines
                            for (let j: number = 0; j < width * height; j++) {
                                if (grid[j] === UNKNOWN) {
                                    let outside: boolean = true;
                                    const jx: number = j % width;
                                    const jy: number = (j / width) | 0;
                                    for (let k: number = 0; k < nsets; k++) {
                                        if (setused[k] &&
                                            setmunge(all_sets[k].x, all_sets[k].y, all_sets[k].mask,
                                                jx, jy, 1, false)) {
                                            outside = false;
                                            break;
                                        }
                                    }
                                    if (outside) {
                                        knownSquares(width, square_todo, grid, open, jx, jy, 1, mn_left !== 0);
                                    }
                                }
                            }
                            done_something = true;
                            break;
                        }

                        do {
                            cursor--;
                        } while (cursor >= 0 && !setused[cursor]);
                        if (cursor >= 0) {
                            mn_left += all_sets[cursor].mines;
                            sq_left += bitcount16(all_sets[cursor].mask);
                            setused[cursor++] = 0;
                        } else {
                            break;
                        }
                    }
                }
            }
        }

        if (done_something) continue;

        if (!perturb) break;

        nperturbs++;
        const all_sets: MineSet[] = set_store.allSets();
        let changes: Perturbation[] | null;
        if (all_sets.length === 0) {
            changes = perturb(grid, 0, 0, 0);
        } else {
            const chosen: MineSet = all_sets[rng.upto(all_sets.length)];
            changes = perturb(grid, chosen.x, chosen.y, chosen.mask);
        }

        if (!changes) break;

        for (const ch of changes) {
            if (ch.delta < 0 && grid[ch.y * width + ch.x] !== UNKNOWN) {
                square_todo.push(ch.y * width + ch.x);
            }
            const affected: MineSet[] = set_store.overlapping(ch.x, ch.y, 1);
            for (const s2 of affected) {
                s2.mines += ch.delta;
                if (!s2.in_todo) {
                    // Re-add to todo by removing and re-inserting
                    set_store.remove(s2);
                    set_store.add(s2.x, s2.y, s2.mask, s2.mines);
                }
            }
        }
    }

    // Check if any unknowns remain
    for (let y: number = 0; y < height; y++) {
        for (let x: number = 0; x < width; x++) {
            if (grid[y * width + x] === UNKNOWN) return -1;
        }
    }
    return nperturbs;
}

interface Square {
    x: number;
    y: number;
    type: number;   // 1 = boundary unknown, 2 = far unknown, 3 = known
    rand: number;
}

function mineperturb(
    mines: Uint8Array,
    grid: Int8Array,
    width: number, height: number,
    start_x: number, start_y: number,   // starting position (protected zone)
    allow_big_perturbs: boolean,
    rng: SeededRng,
    setx: number, sety: number, mask: number
): Perturbation[] | null {
    if (mask === 0 && !allow_big_perturbs) return null;

    // Build a sorted candidate list (preference: boundary > far > known)
    const candidates: Square[] = [];
    for (let y: number = 0; y < height; y++) {
        for (let x: number = 0; x < width; x++) {
            // Protect the 3×3 zone around the starting square
            if (Math.abs(y - start_y) <= 1 && Math.abs(x - start_x) <= 1) continue;

            // Exclude squares that are part of the input set
            const in_set: boolean = (mask === 0)
                ? grid[y * width + x] === UNKNOWN
                : (x >= setx && x < setx + 3 && y >= sety && y < sety + 3 &&
                    !!(mask & (1 << ((y - sety) * 3 + (x - setx)))));
            if (in_set) continue;

            let type: number;
            if (grid[y * width + x] !== UNKNOWN) {
                type = 3;
            } else {
                type = 2;
                outer: for (let dy: number = -1; dy <= 1; dy++) {
                    for (let dx: number = -1; dx <= 1; dx++) {
                        if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height &&
                            grid[(y + dy) * width + (x + dx)] !== UNKNOWN) {
                            type = 1;
                            break outer;
                        }
                    }
                }
            }

            candidates.push({x, y, type, rand: rng.bits31()});
        }
    }

    candidates.sort((a, b) => a.type !== b.type ? a.type - b.type : a.rand - b.rand);

    // Count full/empty squares in the input set
    let nfull: number = 0;
    let nempty: number = 0;
    if (mask !== 0) {
        for (let dy: number = 0; dy < 3; dy++) {
            for (let dx: number = 0; dx < 3; dx++) {
                if (mask & (1 << (dy * 3 + dx))) {
                    if (mines[(sety + dy) * width + (setx + dx)]) nfull++;
                    else nempty++;
                }
            }
        }
    } else {
        for (let y: number = 0; y < height; y++) {
            for (let x: number = 0; x < width; x++) {
                if (grid[y * width + x] === UNKNOWN) {
                    if (mines[y * width + x]) nfull++;
                    else nempty++;
                }
            }
        }
    }

    // Find enough squares outside the set to swap with
    const tofill: Square[] = [];
    const toempty: Square[] = [];
    for (const sq of candidates) {
        if (mines[sq.y * width + sq.x]) toempty.push(sq);
        else tofill.push(sq);
        if (tofill.length === nfull || toempty.length === nempty) break;
    }

    // Determine direction: fill the set or empty it
    let todo: Square[];
    let dtodo: number;
    let dset: number;
    let set_indices: number[] | null = null;

    if (tofill.length === nfull) {
        todo = tofill;
        dtodo = +1;
        dset = -1;
    } else if (toempty.length === nempty) {
        todo = toempty;
        dtodo = -1;
        dset = +1;
    } else {
        // Partial: pick `toempty.length` empty squares from the set at random
        if (toempty.length === 0) return null;
        const empty_in_set: number[] = [];
        if (mask !== 0) {
            for (let dy: number = 0; dy < 3; dy++) {
                for (let dx: number = 0; dx < 3; dx++) {
                    if (mask & (1 << (dy * 3 + dx))) {
                        const idx: number = (sety + dy) * width + (setx + dx);
                        if (!mines[idx]) empty_in_set.push(idx);
                    }
                }
            }
        } else {
            for (let y: number = 0; y < height; y++) {
                for (let x: number = 0; x < width; x++) {
                    if (grid[y * width + x] === UNKNOWN && !mines[y * width + x]) {
                        empty_in_set.push(y * width + x);
                    }
                }
            }
        }
        // Fisher-Yates shuffle, keep first toempty.length
        for (let k: number = 0; k < toempty.length; k++) {
            const idx: number = k + rng.upto(empty_in_set.length - k);
            [empty_in_set[k], empty_in_set[idx]] = [empty_in_set[idx], empty_in_set[k]];
        }
        set_indices = empty_in_set.slice(0, toempty.length);
        todo = toempty;
        dtodo = -1;
        dset = +1;
    }

    // Build the perturbation list
    const changes: Perturbation[] = [];
    for (const sq of todo) {
        changes.push({x: sq.x, y: sq.y, delta: dtodo});
    }

    if (set_indices !== null) {
        for (const idx of set_indices) {
            changes.push({x: idx % width, y: (idx / width) | 0, delta: dset});
        }
    } else if (mask !== 0) {
        for (let dy: number = 0; dy < 3; dy++) {
            for (let dx: number = 0; dx < 3; dx++) {
                if (mask & (1 << (dy * 3 + dx))) {
                    const currval: 1 | -1 = mines[(sety + dy) * width + (setx + dx)] ? +1 : -1;
                    if (dset === -currval) {
                        changes.push({x: setx + dx, y: sety + dy, delta: dset});
                    }
                }
            }
        }
    } else {
        for (let y: number = 0; y < height; y++) {
            for (let x: number = 0; x < width; x++) {
                if (grid[y * width + x] === UNKNOWN) {
                    const currval: 1 | -1 = mines[y * width + x] ? +1 : -1;
                    if (dset === -currval) {
                        changes.push({x, y, delta: dset});
                    }
                }
            }
        }
    }

    // Apply changes to the actual mine grid
    for (const ch of changes) {
        mines[ch.y * width + ch.x] = ch.delta > 0 ? 1 : 0;

        // Update adjacent counts in the solver grid
        for (let dy: number = -1; dy <= 1; dy++) {
            for (let dx: number = -1; dx <= 1; dx++) {
                const nx: number = ch.x + dx;
                const ny: number = ch.y + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                if (grid[ny * width + nx] === UNKNOWN) continue;
                if (dx === 0 && dy === 0) {
                    if (ch.delta > 0) {
                        grid[ny * width + nx] = KNOWN_MINE;
                    } else {
                        let count: number = 0;
                        for (let dy2: number = -1; dy2 <= 1; dy2++) {
                            for (let dx2: number = -1; dx2 <= 1; dx2++) {
                                const nx2: number = ch.x + dx2;
                                const ny2: number = ch.y + dy2;
                                if (nx2 >= 0 && nx2 < width && ny2 >= 0 && ny2 < height && mines[ny2 * width + nx2]) count++;
                            }
                        }
                        grid[ny * width + nx] = count;
                    }
                } else {
                    if (grid[ny * width + nx] >= 0) {
                        grid[ny * width + nx] = (grid[ny * width + nx] + ch.delta) as number;
                    }
                }
            }
        }
    }

    return changes;
}

/**
 * Open a square on the real mine grid and return its adjacent mine count.
 * Returns -1 if it's a mine (should never happen during generation).
 */
function mineopen(mines: Uint8Array, width: number, height: number, x: number, y: number): number {
    if (mines[y * width + x]) return -1; // mine — should not happen
    let n: number = 0;
    for (let dy: number = -1; dy <= 1; dy++) {
        for (let dx: number = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
            if (mines[(y + dy) * width + (x + dx)]) n++;
        }
    }
    return n;
}

/**
 * Generate a mine layout of size width×height with nb_mines mines, guaranteed solvable
 * from the starting square (start_x, start_y) without guessing.
 *
 * Returns a flat Uint8Array of length width*height, where 1 = mine, 0 = safe.
 */
export function minegen(
    width: number, height: number, nb_mines: number,
    start_x: number, start_y: number,
    rng: SeededRng
): Uint8Array {
    const mines: Uint8Array = new Uint8Array(width * height);
    let success: boolean = false;
    let ntries: number = 0;

    do {
        ntries++;
        mines.fill(0);

        const candidates: number[] = [];
        for (let y: number = 0; y < height; y++) {
            for (let x: number = 0; x < width; x++) {
                if (Math.abs(y - start_y) > 1 || Math.abs(x - start_x) > 1) {
                    candidates.push(y * width + x);
                }
            }
        }

        let k: number = candidates.length;
        for (let i: number = 0; i < nb_mines; i++) {
            const j: number = i + rng.upto(k - i);
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
            mines[candidates[i]] = 1;
        }

        // Run the solver; if it stalls, perturb and retry
        const solvegrid: Int8Array = new Int8Array(width * height).fill(UNKNOWN as number);
        solvegrid[start_y * width + start_x] = mineopen(mines, width, height, start_x, start_y);

        const allow_big_perturbs: boolean = ntries > 100;

        const openFn: OpenFn = (x: number, y: number): number => mineopen(mines, width, height, x, y);
        const perturbFn: PerturbFn = (grid: Int8Array, setx: number, sety: number, mask: number): Perturbation[] | null =>
            mineperturb(mines, grid, width, height, start_x, start_y, allow_big_perturbs, rng, setx, sety, mask);

        let prevret: number = -2;
        while (true) {
            solvegrid.fill(UNKNOWN as number);
            solvegrid[start_y * width + start_x] = mineopen(mines, width, height, start_x, start_y);

            const ret: number = minesolve(width, height, nb_mines, solvegrid, openFn, perturbFn, rng);
            if (ret < 0 || (prevret >= 0 && ret >= prevret)) {
                success = false;
                break;
            } else if (ret === 0) {
                success = true;
                break;
            }
            prevret = ret;
        }
    } while (!success);

    return mines;
}

export interface GeneratedBoard {
    /** Flat array: 1 = mine, 0 = safe */
    mines: Uint8Array;
    /** Flat array: adjacent mine count for each safe cell */
    adjacent_counts: Uint8Array;
    width: number;
    height: number;
}

/**
 * Generate a solvable minesweeper board.
 *
 * @param width     board width
 * @param height    board height
 * @param nb_mines  number of mines
 * @param start_x   first-click x (mines will be absent from its 3×3 neighbourhood)
 * @param start_y   first-click y
 * @param seed      RNG seed (same seed + same click = same board)
 */
export function generateSolvableBoard(
    width: number, height: number, nb_mines: number,
    start_x: number, start_y: number,
    seed: number
): GeneratedBoard {
    const rng: SeededRng = new SeededRng(seed);
    const mines: Uint8Array = minegen(width, height, nb_mines, start_x, start_y, rng);

    const adjacent_counts: Uint8Array = new Uint8Array(width * height);
    for (let y: number = 0; y < height; y++) {
        for (let x: number = 0; x < width; x++) {
            if (mines[y * width + x]) continue;
            let count: number = 0;
            for (let dy: number = -1; dy <= 1; dy++) {
                for (let dx: number = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height) {
                        if (mines[(y + dy) * width + (x + dx)]) count++;
                    }
                }
            }
            adjacent_counts[y * width + x] = count;
        }
    }

    return {mines, adjacent_counts: adjacent_counts, width: width, height: height};
}
