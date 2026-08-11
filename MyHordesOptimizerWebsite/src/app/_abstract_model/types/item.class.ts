import { ItemDTO } from '../dto/item.dto';
import { Action } from '../enum/action.enum';
import { Property } from '../enum/property.enum';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { I18nLabels } from './_types';
import { Category } from './category.class';
import { ItemSummary } from './item-summary.class';
import { Recipe } from './recipe.class';

export class Item extends CommonModel<ItemDTO> {
    public uid!: string;
    public img!: string;
    /** Icône de l'objet cassé, `null` quand le jeu n'en prévoit pas de distincte. */
    public img_broken: string | null = null;
    public label!: I18nLabels;
    public description!: I18nLabels;
    public id!: number;
    public category!: Category;
    public deco!: number;
    public is_heaver!: boolean;
    public guard!: number;
    public properties: Property[] = [];
    public actions: Action[] = [];
    public recipes: Recipe[] = [];
    /** Objets permettant d'ouvrir celui-ci. `null` si ce n'est pas un contenant. */
    public opened_with: ItemSummary[] | null = null;
    /** Contenants que cet objet permet d'ouvrir. */
    public opens: ItemSummary[] = [];
    /** Coût en PA d'une tentative d'ouverture sans outil, pour un contenant à risque d'échec. */
    public open_ap_cost: number | null = null;
    /** Chance de réussite (0..1) associée à `open_ap_cost`. */
    public open_success_rate: number | null = null;
    /** Coût en PC de l'alternative réservée au métier Technicien à l'outil requis, si elle existe. */
    public technician_open_cp_cost: number | null = null;
    public bank_count!: number;
    public wishlist_count!: number;
    public drop_rate_not_praf!: number;
    public drop_rate_praf!: number;
    public is_broken?: boolean;

    public constructor(dto?: ItemDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): ItemDTO {
        return {
            actions: this.actions ? this.actions.filter((action: Action) => action).map((action: Action) => action?.key) : [],
            bankCount: this.bank_count,
            category: this.category?.modelToDto(),
            deco: this.deco,
            description: this.description,
            guard: this.guard,
            img: this.img,
            imgBroken: this.img_broken,
            isHeaver: this.is_heaver,
            label: this.label,
            properties: this.properties ? this.properties.filter((property: Property) => property).map((property: Property) => property?.key) : [],
            recipes: modelToDtoArray(this.recipes),
            openedWith: this.opened_with ? modelToDtoArray(this.opened_with) : null,
            opens: modelToDtoArray(this.opens),
            openApCost: this.open_ap_cost,
            openSuccessRate: this.open_success_rate,
            technicianOpenCpCost: this.technician_open_cp_cost,
            wishListCount: this.wishlist_count,
            id: this.id,
            uid: this.uid,
            dropRateNotPraf: this.drop_rate_not_praf,
            dropRatePraf: this.drop_rate_praf,
        };
    }

    protected dtoToModel(dto?: ItemDTO): void {
        if (dto) {
            this.actions = dto.actions ? <Action[]>dto.actions.map((action: string) => Action.getByKey(action)) : [];
            this.bank_count = dto.bankCount;
            this.category = new Category(dto.category);
            this.deco = dto.deco;
            this.description = dto.description;
            this.guard = dto.guard;
            this.img = dto.img ? dto.img.replace(/\..*\./, '.') : '';
            // Surtout PAS le même nettoyage d'empreinte : le nom d'une icône cassée porte un point
            // de plus (`item_wrench.b.gif`), et l'expression le prendrait pour une empreinte de
            // version — elle rendrait `item_wrench.gif`, c'est-à-dire l'icône intacte.
            this.img_broken = dto.imgBroken ?? null;
            this.is_heaver = dto.isHeaver;
            this.label = dto.label;
            this.properties = dto.properties ? <Property[]>dto.properties.map((property: string) => Property.getByKey(property)) : [];
            this.recipes = dtoToModelArray(Recipe, dto.recipes);
            this.opened_with = dto.openedWith ? dtoToModelArray(ItemSummary, dto.openedWith) : null;
            this.opens = dtoToModelArray(ItemSummary, dto.opens);
            this.open_ap_cost = dto.openApCost ?? null;
            this.open_success_rate = dto.openSuccessRate ?? null;
            this.technician_open_cp_cost = dto.technicianOpenCpCost ?? null;
            this.wishlist_count = dto.wishListCount;
            this.uid = dto.uid;
            this.id = dto.id;
            this.drop_rate_not_praf = dto.dropRateNotPraf;
            this.drop_rate_praf = dto.dropRatePraf;
        }
    }

}
