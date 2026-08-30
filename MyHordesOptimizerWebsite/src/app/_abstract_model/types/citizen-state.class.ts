import { CitizenStateDTO } from '../dto/citizen-state.dto';
import { CommonModel } from './_common.class';

export class CitizenState extends CommonModel<CitizenStateDTO> {
    public ap: number = 0;
    public sp: number = 0;
    public wounded: boolean = false;
    public is_eclaireur: boolean = false;
    public has_bike: boolean = false;
    public has_shoes: boolean = false;
    public walking_distance: number = 0;
    public is_dead: boolean = false;
    public statuses: string[] = [];
    public has_shield: boolean = false;
    public has_defence_cp_item: boolean = false;
    public is_guide: boolean = false;
    public zone_citizen_count: number = 0;
    public has_clean_pdc_perk: boolean = false;
    public has_hydrated_pdc_perk: boolean = false;
    public has_sober_pdc_perk: boolean = false;
    public has_base_zone_control_perk: boolean = false;
    public is_role_ghoul: boolean = false;
    /** Calculé côté serveur (CitizenPdcRules) — jamais renvoyé au serveur, voir {@link modelToDto}. */
    public pdc: number = 0;

    public constructor(dto?: CitizenStateDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): CitizenStateDTO {
        return {
            ap: this.ap,
            sp: this.sp,
            wounded: this.wounded,
            isEclaireur: this.is_eclaireur,
            hasBike: this.has_bike,
            hasShoes: this.has_shoes,
            walkingDistance: this.walking_distance,
            isDead: this.is_dead,
            statuses: this.statuses,
            hasShield: this.has_shield,
            hasDefenceCpItem: this.has_defence_cp_item,
            isGuide: this.is_guide,
            zoneCitizenCount: this.zone_citizen_count,
            hasCleanPdcPerk: this.has_clean_pdc_perk,
            hasHydratedPdcPerk: this.has_hydrated_pdc_perk,
            hasSoberPdcPerk: this.has_sober_pdc_perk,
            hasBaseZoneControlPerk: this.has_base_zone_control_perk,
            isRoleGhoul: this.is_role_ghoul,
        };
    }

    protected dtoToModel(dto?: CitizenStateDTO): void {
        if (dto) {
            this.ap = dto.ap;
            this.sp = dto.sp;
            this.wounded = dto.wounded;
            this.is_eclaireur = dto.isEclaireur;
            this.has_bike = dto.hasBike;
            this.has_shoes = dto.hasShoes;
            this.walking_distance = dto.walkingDistance;
            this.is_dead = dto.isDead;
            this.statuses = dto.statuses ?? [];
            this.has_shield = dto.hasShield ?? false;
            this.has_defence_cp_item = dto.hasDefenceCpItem ?? false;
            this.is_guide = dto.isGuide ?? false;
            this.zone_citizen_count = dto.zoneCitizenCount ?? 0;
            this.has_clean_pdc_perk = dto.hasCleanPdcPerk ?? false;
            this.has_hydrated_pdc_perk = dto.hasHydratedPdcPerk ?? false;
            this.has_sober_pdc_perk = dto.hasSoberPdcPerk ?? false;
            this.has_base_zone_control_perk = dto.hasBaseZoneControlPerk ?? false;
            this.is_role_ghoul = dto.isRoleGhoul ?? false;
            this.pdc = dto.pdc ?? 0;
        }
    }
}
