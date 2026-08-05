import { BuildingAvailabilityStatusDTO, BuildingDTO, BuildingResourceDTO } from '../dto/building.dto';
import { BlueprintEnum } from '../enum/blueprint.enum';
import { CommonModel } from './_common.class';
import { I18nLabels, TownTypeId } from './_types';

/** Une ressource requise par un chantier. */
export class BuildingResource extends CommonModel<BuildingResourceDTO> {
    public item_id!: number;
    public uid!: string;
    public img!: string;
    public label!: I18nLabels;
    public count!: number;

    public constructor(dto?: BuildingResourceDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): BuildingResourceDTO {
        return { itemId: this.item_id, uid: this.uid, img: this.img, label: this.label, count: this.count };
    }

    protected dtoToModel(dto?: BuildingResourceDTO): void {
        if (dto) {
            this.item_id = dto.itemId;
            this.uid = dto.uid;
            this.img = dto.img;
            this.label = dto.label;
            this.count = dto.count;
        }
    }
}

/** Un chantier de ville, avec ses évolutions. */
export class Building extends CommonModel<BuildingDTO> {
    public id!: number;
    public uid!: string;
    public img!: string;
    public label!: I18nLabels;
    public description!: I18nLabels;
    public parent_id: number | null = null;
    public display_order: number | null = null;
    public pa!: number;
    public defence!: number;
    public max_life!: number;
    public breakable!: boolean;
    public temporary!: boolean;
    public has_upgrade!: boolean;
    public rarity!: number;
    public resources: BuildingResource[] = [];
    public has_hard_mode!: boolean;
    public tier0_ap: number | null = null;
    public tier0_resources: BuildingResource[] = [];
    public tier1_ap: number | null = null;
    public tier1_resources: BuildingResource[] = [];
    public tier2_ap: number | null = null;
    public hard_blueprint_level: number | null = null;
    public availability: Partial<Record<TownTypeId, BuildingAvailabilityStatusDTO>> = {};

    /** Évolutions directes, reconstruites à l'affichage — jamais transmises par l'API. */
    public children: Building[] = [];
    /** Profondeur dans l'arbre, 0 pour une racine. Sert à l'indentation. */
    public depth: number = 0;

    public constructor(dto?: BuildingDTO) {
        super();
        this.dtoToModel(dto);
    }

    /** Ce qu'il faut pour le débloquer, ou `undefined` si le niveau est inconnu. */
    public get blueprint(): BlueprintEnum | undefined {
        return BlueprintEnum.fromRarity(this.rarity);
    }

    public modelToDto(): BuildingDTO {
        return {
            id: this.id,
            uid: this.uid,
            img: this.img,
            label: this.label,
            description: this.description,
            parentId: this.parent_id,
            displayOrder: this.display_order,
            pa: this.pa,
            defence: this.defence,
            maxLife: this.max_life,
            breakable: this.breakable,
            temporary: this.temporary,
            hasUpgrade: this.has_upgrade,
            rarity: this.rarity,
            resources: this.resources.map((resource: BuildingResource): BuildingResourceDTO => resource.modelToDto()),
            hasHardMode: this.has_hard_mode,
            tier0Ap: this.tier0_ap,
            tier0Resources: this.tier0_resources.map((resource: BuildingResource): BuildingResourceDTO => resource.modelToDto()),
            tier1Ap: this.tier1_ap,
            tier1Resources: this.tier1_resources.map((resource: BuildingResource): BuildingResourceDTO => resource.modelToDto()),
            tier2Ap: this.tier2_ap,
            hardBlueprintLevel: this.hard_blueprint_level,
            availability: this.availability
        };
    }

    protected dtoToModel(dto?: BuildingDTO): void {
        if (dto) {
            this.id = dto.id;
            this.uid = dto.uid;
            this.img = dto.img;
            this.label = dto.label;
            this.description = dto.description;
            this.parent_id = dto.parentId ?? null;
            this.display_order = dto.displayOrder ?? null;
            this.pa = dto.pa;
            this.defence = dto.defence;
            this.max_life = dto.maxLife;
            this.breakable = dto.breakable;
            this.temporary = dto.temporary;
            this.has_upgrade = dto.hasUpgrade;
            this.rarity = dto.rarity;
            this.resources = (dto.resources ?? []).map((resource: BuildingResourceDTO): BuildingResource => new BuildingResource(resource));
            this.has_hard_mode = dto.hasHardMode;
            this.tier0_ap = dto.tier0Ap ?? null;
            this.tier0_resources = (dto.tier0Resources ?? []).map((resource: BuildingResourceDTO): BuildingResource => new BuildingResource(resource));
            this.tier1_ap = dto.tier1Ap ?? null;
            this.tier1_resources = (dto.tier1Resources ?? []).map((resource: BuildingResourceDTO): BuildingResource => new BuildingResource(resource));
            this.tier2_ap = dto.tier2Ap ?? null;
            this.hard_blueprint_level = dto.hardBlueprintLevel ?? null;
            this.availability = dto.availability ?? {};
        }
    }
}
