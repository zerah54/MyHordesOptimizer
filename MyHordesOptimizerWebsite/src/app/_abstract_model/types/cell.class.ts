import { CellDTO } from '../dto/cell.dto';
import { ZoneRegen } from '../enum/zone-regen.enum';
import { ItemCountShort } from './item-count-short.class';
import { UpdateInfo } from './update-info.class';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';

export class Cell extends CommonModel<CellDTO> {
    public cell_id!: number;
    public x!: number;
    public y!: number;
    public is_town!: boolean;
    public is_never_visited!: boolean;
    public is_visited_today!: boolean;
    public danger_level!: number;
    public ruin_id!: number;
    public is_dryed!: boolean;
    public nb_zombie!: number;
    public nb_zombie_killed!: number;
    public nb_hero!: number;
    public is_ruin_camped!: boolean;
    public is_ruin_dryed!: boolean;
    public nb_ruin_dig!: number;
    public total_success!: number;
    public average_potential_remaining_dig!: number;
    public max_potential_remaining_dig!: number;
    public update_info!: UpdateInfo;
    public items!: ItemCountShort[];
    public nb_pa!: number;
    public nb_km!: number;
    public zone_regen!: ZoneRegen | undefined;

    constructor(dto?: CellDTO) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): CellDTO {
        return {
            cellId: this.cell_id,
            x: this.x,
            y: this.y,
            isTown: this.is_town,
            isNeverVisited: this.is_never_visited,
            isVisitedToday: this.is_visited_today,
            dangerLevel: this.danger_level,
            idRuin: this.ruin_id,
            isDryed: this.is_dryed,
            nbZombie: this.nb_hero,
            nbZombieKilled: this.nb_zombie_killed,
            nbHero: this.nb_hero,
            isRuinCamped: this.is_ruin_camped,
            isRuinDryed: this.is_ruin_dryed,
            nbRuinDig: this.nb_ruin_dig,
            totalSucces: this.total_success,
            averagePotentialRemainingDig: this.average_potential_remaining_dig,
            maxPotentialRemainingDig: this.max_potential_remaining_dig,
            lastUpdateInfo: this.update_info?.modelToDto(),
            items: modelToDtoArray(this.items),
            nbKm: this.nb_km,
            nbPa: this.nb_pa,
            zoneRegen: this.zone_regen?.key
        };
    }

    protected override dtoToModel(dto?: CellDTO): void {
        if (dto) {
            this.cell_id = dto.cellId;
            this.x = dto.x;
            this.y = dto.y;
            this.is_town = dto.isTown;
            this.is_never_visited = dto.isNeverVisited;
            this.is_visited_today = dto.isVisitedToday;
            this.danger_level = dto.dangerLevel;
            this.ruin_id = dto.idRuin;
            this.is_dryed = dto.isDryed;
            this.nb_zombie = dto.nbZombie;
            this.nb_zombie_killed = dto.nbZombieKilled;
            this.nb_hero = dto.nbHero;
            this.is_ruin_camped = dto.isRuinCamped;
            this.is_ruin_dryed = dto.isRuinDryed;
            this.nb_ruin_dig = dto.nbRuinDig;
            this.total_success = dto.totalSucces;
            this.average_potential_remaining_dig = dto.averagePotentialRemainingDig;
            this.max_potential_remaining_dig = dto.maxPotentialRemainingDig;
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
            this.items = dtoToModelArray(ItemCountShort, dto.items);
            this.nb_pa = dto.nbPa;
            this.nb_km = dto.nbKm;
            this.zone_regen = dto.zoneRegen ? <ZoneRegen>ZoneRegen.getByKey(dto.zoneRegen) : undefined;
        }
    };

}
