import { CellDTO, SaveCellDTO, ScavNextCellsDTO, ScoutNextCellsDTO } from '../dto/cell.dto';
import { Direction } from '../enum/direction.enum';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { Citizen } from './citizen.class';
import { ItemCountShort } from './item-count-short.class';
import { UpdateInfo } from './update-info.class';

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
    private is_ruin_camped!: boolean;
    public is_ruin_dryed!: boolean;
    public nb_ruin_dig!: number;
    public total_success!: number;
    public average_potential_remaining_dig!: number;
    public max_potential_remaining_dig!: number;
    public update_info!: UpdateInfo;
    public items!: ItemCountShort[];
    public citizens!: Citizen[];
    public nb_pa!: number;
    public nb_km!: number;
    public zone_regen!: Direction | undefined;
    public displayed_x!: number;
    public displayed_y!: number;
    public note!: string;
    private nb_ruin_success!: number;
    public nb_eruin_blue!: number;
    public nb_eruin_yellow!: number;
    public nb_eruin_violet!: number;
    /** Niveau d'abondance de la zone relevé par un fouineur, de 0 (épuisée) à 3 (abondante) */
    public scav_zone_level!: number | null;
    /** Niveau d'exploration de la zone relevé par un éclaireur, de 0 à 3 */
    public scout_zone_level!: number | null;
    /** Estimation bruitée du nombre de zombies, issue du radar d'un éclaireur voisin */
    public scout_estimation_zombie!: number | null;
    /** Borne basse du nombre réel de zombies déduite de l'estimation */
    public scout_estimation_min!: number | null;
    /** Borne haute du nombre réel de zombies déduite de l'estimation */
    public scout_estimation_max!: number | null;
    /** Fraîcheur propre à l'estimation, à comparer à update_info */
    public scout_estimation_update_info!: UpdateInfo | null;
    /** Radar du fouineur saisi manuellement depuis cette case, jamais renvoyé par l'API */
    public scav_next_cells: ScavNextCellsDTO | null = null;
    /** Radar de l'éclaireur saisi manuellement depuis cette case, jamais renvoyé par l'API */
    public scout_next_cells: ScoutNextCellsDTO | null = null;

    public constructor(dto?: CellDTO) {
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
            nbZombie: this.nb_zombie,
            nbZombieKilled: this.nb_zombie_killed,
            nbHero: this.nb_hero,
            isRuinCamped: this.is_ruin_camped,
            isRuinDryed: this.is_ruin_dryed,
            nbRuinDig: this.nb_ruin_dig,
            totalSucces: this.total_success,
            averagePotentialRemainingDig: this.average_potential_remaining_dig,
            maxPotentialRemainingDig: this.max_potential_remaining_dig,
            scavZoneLevel: this.scav_zone_level,
            scoutZoneLevel: this.scout_zone_level,
            scoutEstimationZombie: this.scout_estimation_zombie,
            scoutEstimationMin: this.scout_estimation_min,
            scoutEstimationMax: this.scout_estimation_max,
            scoutEstimationLastUpdateInfo: this.scout_estimation_update_info?.modelToDto() ?? null,
            lastUpdateInfo: this.update_info?.modelToDto(),
            items: modelToDtoArray(this.items),
            nbKm: this.nb_km,
            nbPa: this.nb_pa,
            zoneRegen: this.zone_regen?.key,
            citizens: modelToDtoArray(this.citizens),
            note: this.note,
            nbRuinSuccess: this.nb_ruin_success,
            nbERuinBlue: this.nb_eruin_blue,
            nbERuinYellow: this.nb_eruin_yellow,
            nbERuinViolet: this.nb_eruin_violet,
            displayX: this.displayed_x,
            displayY: this.displayed_y
        };
    }

    /**
     * L'estimation d'un éclaireur ne prime sur le nombre de zombies connu que si elle
     * a été relevée après la dernière mise à jour de la case.
     */
    public hasFresherScoutEstimation(): boolean {
        if (this.scout_estimation_zombie === null || this.scout_estimation_zombie === undefined) return false;
        if (!this.scout_estimation_update_info?.update_time) return false;
        if (!this.update_info?.update_time) return true;
        return this.scout_estimation_update_info.update_time.isAfter(this.update_info.update_time);
    }

    public toSaveCellDTO(): SaveCellDTO {
        return {
            x: this.x,
            y: this.y,
            isDryed: this.is_dryed,
            scavZoneLevel: this.scav_zone_level,
            scoutZoneLevel: this.scout_zone_level,
            scavNextCells: this.scav_next_cells,
            scoutNextCells: this.scout_next_cells,
            nbZombie: this.nb_hero || 0,
            nbZombieKilled: this.nb_zombie_killed || 0,
            isRuinCamped: this.is_ruin_camped,
            items: modelToDtoArray(this.items),
            note: this.note,
            citizens: this.citizens.map((citizen: Citizen) => citizen.id),
            nbRuinDig: this.nb_ruin_dig || 0,
            isRuinDryed: this.is_ruin_dryed,
            nbRuinSuccess: this.nb_ruin_success,
            nbERuinBlue: this.nb_eruin_blue,
            nbERuinYellow: this.nb_eruin_yellow,
            nbERuinViolet: this.nb_eruin_violet
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
            this.scav_zone_level = dto.scavZoneLevel;
            this.scout_zone_level = dto.scoutZoneLevel;
            this.scout_estimation_zombie = dto.scoutEstimationZombie;
            this.scout_estimation_min = dto.scoutEstimationMin;
            this.scout_estimation_max = dto.scoutEstimationMax;
            this.scout_estimation_update_info = dto.scoutEstimationLastUpdateInfo ? new UpdateInfo(dto.scoutEstimationLastUpdateInfo) : null;
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
            this.items = dtoToModelArray(ItemCountShort, dto.items);
            this.citizens = dtoToModelArray(Citizen, dto.citizens);
            this.nb_pa = dto.nbPa;
            this.nb_km = dto.nbKm;
            this.zone_regen = dto.zoneRegen ? <Direction>Direction.getByKey(dto.zoneRegen) : undefined;
            this.displayed_x = dto.displayX;
            this.displayed_y = dto.displayY;
            this.note = dto.note;
            this.nb_ruin_success = dto.nbRuinSuccess;
            this.nb_eruin_blue = dto.nbERuinBlue;
            this.nb_eruin_yellow = dto.nbERuinYellow;
            this.nb_eruin_violet = dto.nbERuinViolet;
        }
    }

}
