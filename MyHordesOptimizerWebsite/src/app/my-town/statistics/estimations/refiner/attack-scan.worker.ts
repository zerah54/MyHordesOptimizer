/// <reference lib="webworker" />
import { scanSeedRangeCpu, ScanTileRequest, ScanTileResponse } from './attack-model';

/**
 * Worker de scan CPU : reçoit une tuile de seeds, la scanne en f64 exact (attack-model) et
 * renvoie les seeds compatibles. Une tuile par message ; l'orchestration (file de tuiles partagée
 * avec le GPU, reprise, annulation) est gérée par AttackRefinerService.
 */
addEventListener('message', ({ data }: MessageEvent<ScanTileRequest>): void => {
    const hits: number[] = scanSeedRangeCpu(data.observed, data.params, data.first_seed, data.count);
    const response: ScanTileResponse = { hits, count: data.count };
    postMessage(response);
});
