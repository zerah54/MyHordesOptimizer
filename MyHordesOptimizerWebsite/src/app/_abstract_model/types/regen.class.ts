import { RegenDTO } from '../dto/regen.dto';
import { Direction } from '../enum/direction.enum';
import { CommonModel } from './_common.class';

export class Regen extends CommonModel<RegenDTO> {
    private day!: number;
    public direction_regen?: Direction;
    private id_town!: number;
    private level_regen!: number;
    private taux_regen!: number;

    public constructor(dto?: RegenDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): RegenDTO {
        return {
            day: this.day,
            directionRegen: this.direction_regen?.key || 'All',
            idTown: this.id_town,
            levelRegen: this.level_regen,
            tauxRegen: this.taux_regen
        };
    }

    protected dtoToModel(dto?: RegenDTO | null): void {
        if (dto) {
            this.day = dto.day;
            this.direction_regen = Direction.getByKey(dto.directionRegen);
            this.id_town = dto.idTown;
            this.level_regen = dto.levelRegen;
            this.taux_regen = dto.tauxRegen;
        }
    }

}
