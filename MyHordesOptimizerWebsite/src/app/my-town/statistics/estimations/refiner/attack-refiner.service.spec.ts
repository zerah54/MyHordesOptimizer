import { Mock } from 'vitest';

import { OffsetPair, RefinerParams } from './attack-model';
import { AttackRefinerService, buildGpuParams, GPU_FIRST_CHUNK, GPU_PARAM_COUNT, nextGpuChunkSize } from './attack-refiner.service';

/**
 * Régression : le compteur atomique GPU (`cntBuf`) doit être remis à zéro avant CHAQUE tuile.
 * Sans ce reset, `slot=atomicAdd(&counter,1u)` du shader s'accumule sur tout le scan 2³² : dès que
 * le total de hits dépasse MAX_HITS (1024), toute tuile suivante perd silencieusement ses
 * trouvailles même si elle contient de vrais candidats (le test `slot<MAX_HITS` échoue toujours).
 */
describe('AttackRefinerService', (): void => {
    let service: AttackRefinerService;
    let write_buffer_targets: unknown[];
    let ctx: {
        device: { queue: { writeBuffer: Mock; submit: Mock; onSubmittedWorkDone: () => Promise<void> }; createCommandEncoder: Mock };
        cntBuf: object;
        parBuf: object;
        pipeline: object;
        bind: object;
    };
    const params: RefinerParams = {
        base_lo_rand: 5, base_hi_rand: 26, off_sum: 28, protect: 3, blocks: 15,
        soul_tdg: new Array<number>(25).fill(1), soul_planif: new Array<number>(25).fill(1), soul_attack: 1, shift_span: 0.1, shift_steps: 1000,
        min_global: 1367, max_global: 2148, rebound_possible: true, fireworks: false
    };

    beforeEach((): void => {
        service = new AttackRefinerService();
        write_buffer_targets = [];
        ctx = {
            device: {
                queue: {
                    writeBuffer: vi.fn((target: object) => write_buffer_targets.push(target)),
                    submit: vi.fn(),
                    onSubmittedWorkDone: (): Promise<void> => Promise.resolve()
                },
                createCommandEncoder: vi.fn(() => ({
                    beginComputePass: () => ({ setPipeline: () => undefined, setBindGroup: () => undefined, dispatchWorkgroups: () => undefined, end: () => undefined }),
                    finish: () => ({})
                }))
            },
            cntBuf: {},
            parBuf: {},
            pipeline: {},
            bind: {}
        };
    });

    it('resets the hit counter buffer before every chunk dispatch', async (): Promise<void> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dispatch: (ctx: unknown, params: RefinerParams, q_last: number, pairs: OffsetPair[], chunk: { first: number; count: number }) => Promise<void> = (service as any).dispatchGpuChunk.bind(service);

        await dispatch(ctx, params, 24, [], { first: 0, count: 64 });
        await dispatch(ctx, params, 24, [], { first: 64, count: 64 });

        const counter_resets: number = write_buffer_targets.filter((target: unknown): boolean => target === ctx.cntBuf).length;
        expect(counter_resets).toBe(2);
    });

    it('discards all hits and stops accepting more once the total-hit cap is exceeded', (): void => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const addHit: (state: { hits: Set<number>; scanned: number; overflow: boolean }, seed: number) => void = (service as any).addHit.bind(service);
        const state: { hits: Set<number>; scanned: number; overflow: boolean } = { hits: new Set<number>(), scanned: 0, overflow: false };

        // Bien au-dessus de n'importe quel MAX_TOTAL_HITS raisonnable, seeds distincts.
        for (let seed: number = 0; seed < 70000; seed++) {
            addHit(state, seed);
        }

        expect(state.overflow).toBe(true);
        // Pas de résultat partiel : le pool est vidé, pas juste plafonné.
        expect(state.hits.size).toBe(0);

        // Une fois en overflow, plus aucun hit n'est accepté (même après le clear).
        addHit(state, 999999);
        expect(state.hits.size).toBe(0);
    });

    it('keeps up to 65536 distinct hits, the API cap, before overflowing', (): void => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const addHit: (state: { hits: Set<number>; scanned: number; overflow: boolean }, seed: number) => void = (service as any).addHit.bind(service);
        const state: { hits: Set<number>; scanned: number; overflow: boolean } = { hits: new Set<number>(), scanned: 0, overflow: false };

        for (let seed: number = 0; seed < 65536; seed++) {
            addHit(state, seed);
        }
        expect(state.overflow).toBe(false);
        expect(state.hits.size).toBe(65536);

        addHit(state, 65536);
        expect(state.overflow).toBe(true);
    });
});

/**
 * Un worker CPU fait des dizaines de milliers de seeds/s (mesuré : ~17k/s en JS), le GPU des
 * millions. Saturer tous les coeurs (cores-1) pendant tout le scan (~30 min) pour un gain de débit
 * négligeable rend la machine inutilisable sans accélérer le scan de façon perceptible — le vrai
 * moteur est le GPU. Les workers CPU ne doivent rester en pleine parallélisation QUE quand le GPU
 * est absent (seul moteur disponible) ; sinon, une petite assurance suffit (reprise si le GPU tombe
 * en cours de scan, cf `runGpuScan`/`requeue`).
 */
describe('AttackRefinerService.cpuWorkerCount', (): void => {
    let service: AttackRefinerService;

    beforeEach((): void => {
        service = new AttackRefinerService();
    });

    function workerCount(cores: number, gpu_available: boolean): number {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (service as any).cpuWorkerCount(cores, gpu_available);
    }

    it('caps CPU workers to a small insurance count when the GPU is available', (): void => {
        expect(workerCount(16, true)).toBe(2);
        expect(workerCount(4, true)).toBe(2);
    });

    it('uses full CPU parallelism when the GPU is unavailable', (): void => {
        expect(workerCount(16, false)).toBe(15);
        expect(workerCount(4, false)).toBe(3);
    });

    it('never goes below 1 worker either way', (): void => {
        expect(workerCount(1, true)).toBe(1);
        expect(workerCount(1, false)).toBe(1);
    });
});

/**
 * Sur une machine à deux GPU (dédié + intégré), `requestAdapter()` sans préférence peut rendre le GPU
 * intégré : mesuré 2 à 2,7× plus lent que le dédié sur le même shader.
 */
describe('AttackRefinerService.ensureDevice', (): void => {
    afterEach((): void => {
        delete (navigator as unknown as { gpu?: unknown }).gpu;
    });

    it('requests the high-performance adapter', async (): Promise<void> => {
        const device: { addEventListener: Mock; lost: Promise<never> } = { addEventListener: vi.fn(), lost: new Promise<never>((): void => undefined) };
        const request_adapter: Mock = vi.fn(() => Promise.resolve({ requestDevice: (): Promise<unknown> => Promise.resolve(device) }));
        Object.defineProperty(navigator, 'gpu', { value: { requestAdapter: request_adapter }, configurable: true });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (new AttackRefinerService() as any).ensureDevice();

        expect(request_adapter).toHaveBeenCalledWith({ powerPreference: 'high-performance' });
    });
});

/**
 * Un dispatch trop long fait perdre le device (mesuré sur GPU intégré : 2,8 s passe, 4,1 s perd le
 * device), et la perte bascule tout le reste du scan sur les workers CPU (des heures). La taille de
 * tuile se cale donc sur la durée mesurée de la précédente.
 */
describe('nextGpuChunkSize', (): void => {
    it('shrinks the next tile after a slow dispatch to aim at the target duration', (): void => {
        expect(nextGpuChunkSize(4194240, 5500)).toBe(Math.floor(4194240 * 500 / 5500));
    });

    it('grows at most 4x per tile', (): void => {
        expect(nextGpuChunkSize(65536, 10)).toBe(4 * 65536);
    });

    it('never exceeds the 65535-workgroup dispatch limit', (): void => {
        expect(nextGpuChunkSize(4194240, 1)).toBe(65535 * 64);
    });

    it('never goes below a minimal tile', (): void => {
        expect(nextGpuChunkSize(65536, 1000000)).toBe(4096);
    });
});

describe('AttackRefinerService.runGpuScan', (): void => {
    afterEach((): void => {
        vi.restoreAllMocks();
    });

    it('sizes each GPU tile from the duration of the previous one', async (): Promise<void> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const service: any = new AttackRefinerService();
        let now: number = 0;
        vi.spyOn(performance, 'now').mockImplementation((): number => now);
        service.createGpuContext = vi.fn(() => Promise.resolve({}));
        service.destroyGpuContext = vi.fn();
        service.readGpuHits = vi.fn(() => Promise.resolve(new Uint32Array(0)));
        // 1 000 seeds par ms simulées.
        service.dispatchGpuChunk = vi.fn((_ctx: unknown, _params: unknown, _q_last: unknown, _pairs: unknown, chunk: { count: number }): Promise<void> => {
            now += chunk.count / 1000;
            return Promise.resolve();
        });
        const requested: number[] = [];
        const queue: { take: Mock; requeue: Mock } = {
            take: vi.fn((max_count: number) => {
                requested.push(max_count);
                return requested.length <= 3 ? { first: 0, count: max_count } : null;
            }),
            requeue: vi.fn()
        };
        const params: RefinerParams = {
            base_lo_rand: 5, base_hi_rand: 26, off_sum: 28, protect: 3, blocks: 15,
            soul_tdg: new Array<number>(25).fill(1), soul_planif: new Array<number>(25).fill(1), soul_attack: 1,
            shift_span: 0.1, shift_steps: 1000, min_global: 1367, max_global: 2148, rebound_possible: true, fireworks: false
        };

        await service.runGpuScan(new Int32Array(100), params, 24, [], queue, { hits: new Set<number>(), scanned: 0, overflow: false }, (): void => undefined);

        expect(requested[0]).toBe(GPU_FIRST_CHUNK);
        expect(requested[1]).toBe(nextGpuChunkSize(GPU_FIRST_CHUNK, GPU_FIRST_CHUNK / 1000));
        expect(requested[2]).toBe(nextGpuChunkSize(requested[1], requested[1] / 1000));
    });
});

describe('buildGpuParams', (): void => {
    const params: RefinerParams = {
        base_lo_rand: 5, base_hi_rand: 26, off_sum: 28, protect: 3, blocks: 15,
        soul_tdg: new Array<number>(25).fill(1), soul_planif: new Array<number>(25).fill(1), soul_attack: 1,
        shift_span: 0.1, shift_steps: 1000,
        min_global: 1367, max_global: 2148, rebound_possible: true, fireworks: false
    };

    it('lays out the GPU params: 9 base ints, 25 tower and 25 planif soul factors x1e6, then the surviving offset pairs', (): void => {
        const soul_tdg: number[] = Array.from({ length: 25 }, (_value: unknown, q: number): number => 1 + q / 100);
        const layout: Int32Array = buildGpuParams(5, 10, { ...params, soul_tdg }, 24, [{ sum: 28, base: 17 }, { sum: 27, base: 3 }]);

        expect(layout.length).toBe(GPU_PARAM_COUNT);
        expect(GPU_PARAM_COUNT).toBe(59 + 1 + 96);
        expect(layout[59]).toBe(2);
        expect(layout[60]).toBe((28 << 8) | 17);
        expect(layout[61]).toBe((27 << 8) | 3);
        expect(layout[0]).toBe(5);
        expect(layout[1]).toBe(10);
        expect(layout[7]).toBe(24);
        expect(layout[8]).toBe(1);
        expect(layout[9 + 3]).toBe(1030000);
        expect(layout[34 + 3]).toBe(1000000);
    });

    it('carries the last-constrained-palier cutoff so the shader can stop the DFS early on partial data', (): void => {
        const layout: Int32Array = buildGpuParams(0, 1, params, 12, []);
        expect(layout[7]).toBe(12);
    });
});
