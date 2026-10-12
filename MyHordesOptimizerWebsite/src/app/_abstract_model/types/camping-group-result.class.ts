import { CampingGroupResultDTO } from '../dto/camping-group.dto';
import { CampingOddsDTO } from '../dto/camping-odds.dto';
import { CommonModel } from './_common.class';
import { CampingOdds } from './camping-odds.class';

/** Chances d'un groupe de campeurs dans l'ordre demandé, et l'ordre de cachette qui maximise les survivants. */
export class CampingGroupResult extends CommonModel<CampingGroupResultDTO> {
    public odds: CampingOdds[] = [];
    public expected_survivors: number = 0;
    /** Indices des campeurs demandés, du premier caché au dernier. */
    public best_order: number[] = [];
    public best_expected_survivors: number = 0;

    public constructor(dto?: CampingGroupResultDTO) {
        super();
        this.dtoToModel(dto);
    }

    /** L'ordre conseillé fait mieux que l'ordre demandé. */
    public get can_improve_order(): boolean {
        return this.best_expected_survivors > this.expected_survivors + 1e-9;
    }

    public override modelToDto(): CampingGroupResultDTO {
        return {
            odds: this.odds.map((odds: CampingOdds): CampingOddsDTO => odds.modelToDto()),
            expectedSurvivors: this.expected_survivors,
            bestOrder: [...this.best_order],
            bestExpectedSurvivors: this.best_expected_survivors
        };
    }

    protected override dtoToModel(dto?: CampingGroupResultDTO): void {
        if (dto) {
            this.odds = dto.odds.map((odds: CampingOddsDTO): CampingOdds => new CampingOdds(odds));
            this.expected_survivors = dto.expectedSurvivors;
            this.best_order = [...dto.bestOrder];
            this.best_expected_survivors = dto.bestExpectedSurvivors;
        }
    }
}
