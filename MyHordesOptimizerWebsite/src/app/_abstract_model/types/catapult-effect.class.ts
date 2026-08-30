import { CatapultEffectDTO } from '../dto/catapult-effect.dto';
import { CommonModel } from './_common.class';
import { ItemSummary } from './item-summary.class';

/** Effet catapulte réel d'un objet — remplace l'ancienne propriété booléenne `fragile`. */
export class CatapultEffect extends CommonModel<CatapultEffectDTO> {
    public fate!: 'Intact' | 'Broken' | 'Transformed' | 'Destroyed';
    public morph_target: ItemSummary | null = null;
    public kill_min: number | null = null;
    public kill_max: number | null = null;
    public repel_seconds: number | null = null;
    public radius: 'Target' | 'Cross' | 'Square' | null = null;

    public constructor(dto?: CatapultEffectDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): CatapultEffectDTO {
        return {
            fate: this.fate,
            morphTarget: this.morph_target ? this.morph_target.modelToDto() : null,
            killMin: this.kill_min,
            killMax: this.kill_max,
            repelSeconds: this.repel_seconds,
            radius: this.radius
        };
    }

    protected dtoToModel(dto?: CatapultEffectDTO): void {
        if (dto) {
            this.fate = dto.fate;
            this.morph_target = dto.morphTarget ? new ItemSummary(dto.morphTarget) : null;
            this.kill_min = dto.killMin;
            this.kill_max = dto.killMax;
            this.repel_seconds = dto.repelSeconds;
            this.radius = dto.radius;
        }
    }
}
