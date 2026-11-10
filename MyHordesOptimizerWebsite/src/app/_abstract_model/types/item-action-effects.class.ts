import { ActionOutcomeDTO, BuildingConditionDTO, ChargeChanceDTO, ItemActionEffectsDTO } from '../dto/item-action-effects.dto';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { ItemSummary } from './item-summary.class';

/** Condition de chantier posée sur une action (construit ou non). */
export class BuildingCondition extends CommonModel<BuildingConditionDTO> {
    public building_uid!: string;
    public built!: boolean;

    public constructor(dto?: BuildingConditionDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): BuildingConditionDTO {
        return { buildingUid: this.building_uid, built: this.built };
    }

    protected dtoToModel(dto?: BuildingConditionDTO): void {
        if (dto) {
            this.building_uid = dto.buildingUid;
            this.built = dto.built;
        }
    }
}

/** Issue possible d'une action sur un objet. */
export class ActionOutcome extends CommonModel<ActionOutcomeDTO> {
    public kind!: ActionOutcomeDTO['kind'];
    public probability!: number;
    public item: ItemSummary | null = null;
    public quantity: number | null = null;
    public kill_min: number | null = null;
    public kill_max: number | null = null;

    public constructor(dto?: ActionOutcomeDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): ActionOutcomeDTO {
        return {
            kind: this.kind,
            probability: this.probability,
            item: this.item ? this.item.modelToDto() : null,
            quantity: this.quantity,
            killMin: this.kill_min,
            killMax: this.kill_max
        };
    }

    protected dtoToModel(dto?: ActionOutcomeDTO): void {
        if (dto) {
            this.kind = dto.kind;
            this.probability = dto.probability;
            this.item = dto.item ? new ItemSummary(dto.item) : null;
            this.quantity = dto.quantity ?? null;
            this.kill_min = dto.killMin ?? null;
            this.kill_max = dto.killMax ?? null;
        }
    }
}

/** Effets d'une action du jeu liée à un objet. */
export class ItemActionEffects extends CommonModel<ItemActionEffectsDTO> {
    public action_name!: string;
    public kind!: ItemActionEffectsDTO['kind'];
    public ap_cost: number | null = null;
    public building_condition: BuildingCondition | null = null;
    public applies_to_town: boolean | null = null;
    /** Forme chargée de l'objet qui porte l'action, quand elle diffère. */
    public via_loaded_form: ItemSummary | null = null;
    public outcomes: ActionOutcome[] = [];

    public constructor(dto?: ItemActionEffectsDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): ItemActionEffectsDTO {
        return {
            actionName: this.action_name,
            kind: this.kind,
            apCost: this.ap_cost,
            buildingCondition: this.building_condition ? this.building_condition.modelToDto() : null,
            appliesToTown: this.applies_to_town,
            viaLoadedForm: this.via_loaded_form ? this.via_loaded_form.modelToDto() : null,
            outcomes: modelToDtoArray(this.outcomes)
        };
    }

    protected dtoToModel(dto?: ItemActionEffectsDTO): void {
        if (dto) {
            this.action_name = dto.actionName;
            this.kind = dto.kind;
            this.ap_cost = dto.apCost ?? null;
            this.building_condition = dto.buildingCondition ? new BuildingCondition(dto.buildingCondition) : null;
            this.applies_to_town = dto.appliesToTown ?? null;
            this.via_loaded_form = dto.viaLoadedForm ? new ItemSummary(dto.viaLoadedForm) : null;
            this.outcomes = dtoToModelArray(ActionOutcome, dto.outcomes);
        }
    }
}

/** Nombre de charges obtenu au rechargement et sa probabilité (0..1). */
export class ChargeChance extends CommonModel<ChargeChanceDTO> {
    public charges!: number;
    public probability!: number;

    public constructor(dto?: ChargeChanceDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): ChargeChanceDTO {
        return { charges: this.charges, probability: this.probability };
    }

    protected dtoToModel(dto?: ChargeChanceDTO): void {
        if (dto) {
            this.charges = dto.charges;
            this.probability = dto.probability;
        }
    }
}
