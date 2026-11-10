import { CommonModule, DecimalPipe, formatNumber, NgOptimizedImage } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    InputSignalWithTransform,
    model,
    ModelSignal,
    OnInit,
    output,
    OutputEmitterRef,
    Signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { Action } from '../../_abstract_model/enum/action.enum';
import { Property } from '../../_abstract_model/enum/property.enum';
import { WishlistService } from '../../_abstract_model/services/wishlist.service';
import { Imports } from '../../_abstract_model/types/_types';
import { ActionOutcome, ChargeChance, ItemActionEffects } from '../../_abstract_model/types/item-action-effects.class';
import { Item } from '../../_abstract_model/types/item.class';
import { RecipeResultItem } from '../../_abstract_model/types/recipe-result-item.class';
import { Recipe } from '../../_abstract_model/types/recipe.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { ItemImgPipe } from '../../_core/pipes/item-img.pipe';
import { getTown } from '../../_core/utilities/localstorage.util';
import { IconApComponent } from '../icon-ap/icon-ap.component';
import { IconCpComponent } from '../icon-cp/icon-cp.component';
import { RecipeComponent } from '../recipe/recipe.component';

/**
 * Rareté en fouille. Les pourcentages bruts ne veulent rien dire à cette échelle : sur une zone
 * non praf, les objets vont de 15,6 % à 0,09 %, médiane 0,46 %, et une vingtaine sont sous
 * 0,1 %. Deux jauges linéaires écraseraient tout contre zéro — d'où les paliers, la phrase
 * « ≈ 1 fouille réussie sur N » et une barre logarithmique.
 */
const DIG_BANDS: { floor: number; key: DigBand; label: string }[] = [
    { floor: 5, key: 'very-common', label: $localize`Très courant` },
    { floor: 1, key: 'common', label: $localize`Courant` },
    { floor: 0.3, key: 'uncommon', label: $localize`Peu courant` },
    { floor: 0.1, key: 'rare', label: $localize`Rare` },
    { floor: 0, key: 'very-rare', label: $localize`Très rare` }
];

/** Bornes de l'échelle logarithmique de la barre, en pourcentage. Volontairement génériques
 *  plutôt que calées sur les extrêmes d'une saison, qui bougeraient à chaque équilibrage. */
const DIG_SCALE_MIN: number = 0.05;
const DIG_SCALE_MAX: number = 100;

/** Au-delà, « 1 sur N » arrondit trop grossièrement (62,5 % deviendrait « 1 sur 2 ») : on passe à une fraction. */
const DIG_FRACTION_FLOOR: number = 25;
/** Plus grand dénominateur d'une fraction lisible. */
const DIG_FRACTION_MAX_OUT_OF: number = 10;

/** Trouvailles héroïques, de la plus petite à la plus grande : seule la plus petite qui donne l'objet est affichée. */
const FIND_TIERS: string[] = ['hero_find', 'hero_find_lucky', 'hero_find_lucky2', 'hero_find_lucky3'];

/**
 * Propriétés masquées sur la fiche : l'appât ne sert qu'au Système de Pièges des Apprivoiseurs, les outils
 * d'ouverture sont déjà portés par la ligne « Ouvre », le cumul de veille par la ligne des chances de survie.
 */
const HIDDEN_PROPERTIES: string[] = ['lure', 'box_opener', 'can_opener', 'parcel_opener', 'nw_impact_cumul'];

/** Les deux recettes consomment-elles exactement les mêmes objets ? */
function sameComponents(a: Recipe, b: Recipe): boolean {
    const key: (recipe: Recipe) => string = (recipe: Recipe): string => recipe.components.map((item: Item): string => item.uid).sort().join('|');
    return key(a) === key(b);
}

/** Charges possibles d'une recharge, de la plus probable à la moins probable. */
export interface ReloadSummary {
    min: number;
    max: number;
    /** « 4 : 50 %, 3 : 25 % » */
    detail: string;
}

export type DigBand = 'very-common' | 'common' | 'uncommon' | 'rare' | 'very-rare';

export interface DigChance {
    /** Probabilité de tomber sur l'objet, en pourcentage, pour la zone qui s'applique. */
    percent: number;
    /** {@link hits} fouilles réussies sur {@link out_of} donnent cet objet. */
    hits: number;
    out_of: number;
    band: DigBand;
    band_label: string;
    /** Largeur de la barre, en pourcentage. */
    bar: number;
    /** Zone praf (épuisée) plutôt que non praf. */
    praf: boolean;
}

/**
 * Fraction de fouilles réussies la plus lisible : « 1 sur N » pour un objet peu courant, sinon la
 * fraction de dénominateur ≤ {@link DIG_FRACTION_MAX_OUT_OF} la plus proche (le plus petit à égalité).
 *
 * @param {number} percent Probabilité en pourcentage, strictement positive
 * @returns {Pick<DigChance, 'hits' | 'out_of'>}
 */
function digFraction(percent: number): Pick<DigChance, 'hits' | 'out_of'> {
    if (percent < DIG_FRACTION_FLOOR) return { hits: 1, out_of: Math.max(1, Math.round(100 / percent)) };

    const rate: number = percent / 100;
    let best: Pick<DigChance, 'hits' | 'out_of'> = { hits: 1, out_of: 1 };
    for (let out_of: number = 2; out_of <= DIG_FRACTION_MAX_OUT_OF; out_of++) {
        const hits: number = Math.max(1, Math.round(rate * out_of));
        if (Math.abs(hits / out_of - rate) < Math.abs(best.hits / best.out_of - rate)) best = { hits, out_of };
    }
    return best;
}

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [RecipeComponent, IconApComponent, IconCpComponent];
const pipes: Imports = [DecimalPipe, ItemImgPipe];
const material_modules: Imports = [MatButtonModule, MatDividerModule];

@Component({
    selector: 'mho-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ItemComponent implements OnInit {
    /** L'élément à afficher si c'est un objet standard */
    public item: ModelSignal<Item> = model.required();
    /** Force l'ouverture de l'élément */
    public forceOpen: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /**
     * Mode « tuile sélectionnable » : le clic ne déplie plus la fiche sur place, il émet
     * {@link itemSelected} pour que le parent l'affiche dans son panneau de détail. Sans quoi
     * ouvrir un objet au milieu d'une grille pousse tous les suivants vers le bas.
     */
    public selectable: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /** Tuile actuellement affichée dans le panneau de détail du parent. */
    public selected: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /** Émis à la place du dépliage quand {@link selectable} est actif. */
    public itemSelected: OutputEmitterRef<Item> = output<Item>();
    /** Le dossier dans lequel sont stockées les images */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    protected readonly locale: string = moment.locale();
    protected display_mode: 'simple' | 'advanced' = 'simple';

    /**
     * Une zone praf ne rend que deux objets (`empty_dig` : souche de bois pourrie et débris
     * métalliques — `CalculateItemDropAction::determineItemPrototypeForZoneDig`). Montrer deux
     * jauges « praf / non praf » laisserait croire que tout objet peut tomber des deux côtés :
     * on n'affiche que la zone qui s'applique.
     */
    protected readonly dig_chance: Signal<DigChance | null> = computed((): DigChance | null => {
        const item: Item = this.item();
        const not_praf: number = (item?.drop_rate_not_praf ?? 0) * 100;
        const praf: number = (item?.drop_rate_praf ?? 0) * 100;
        const percent: number = not_praf > 0 ? not_praf : praf;
        if (!(percent > 0)) return null;

        const band: { key: DigBand; label: string } = DIG_BANDS.find((candidate: { floor: number }): boolean => percent >= candidate.floor)
            ?? DIG_BANDS[DIG_BANDS.length - 1];
        const ratio: number = (Math.log10(Math.max(percent, DIG_SCALE_MIN)) - Math.log10(DIG_SCALE_MIN))
            / (Math.log10(DIG_SCALE_MAX) - Math.log10(DIG_SCALE_MIN));

        return {
            percent,
            ...digFraction(percent),
            band: band.key,
            band_label: band.label,
            bar: Math.max(4, Math.min(100, Math.round(ratio * 100))),
            praf: not_praf <= 0
        };
    });
    /** Actions à afficher : sans le « détruit » des ouvertures ni la forme vide des attaques d'armes à charges. */
    protected readonly action_effects: Signal<ItemActionEffects[]> = computed((): ItemActionEffects[] => {
        const item: Item = this.item();
        const has_charges: boolean = (item?.reload_charges?.length ?? 0) > 0;
        return (item?.action_effects ?? []).map((effects: ItemActionEffects): ItemActionEffects => Object.assign(new ItemActionEffects(), effects, {
            outcomes: effects.outcomes.filter((outcome: ActionOutcome): boolean =>
                !(effects.kind === 'Open' && outcome.kind === 'Consumed')
                && !(has_charges && effects.kind === 'Attack' && outcome.kind === 'Transformed'))
        }));
    });
    /** Devenir de l'objet en veille, affiché juste au-dessus de la catapulte. */
    protected readonly watch_effects: Signal<ItemActionEffects[]> = computed((): ItemActionEffects[] =>
        this.action_effects().filter((effects: ItemActionEffects): boolean => effects.kind === 'Nightwatch'));
    /** Actions autres que la veille. */
    protected readonly other_action_effects: Signal<ItemActionEffects[]> = computed((): ItemActionEffects[] =>
        this.action_effects().filter((effects: ItemActionEffects): boolean => effects.kind !== 'Nightwatch'));
    /** Recettes à afficher : sans celles de l'Établi des Techniciens que l'Atelier donne déjà. */
    protected readonly displayed_recipes: Signal<Recipe[]> = computed((): Recipe[] => {
        const recipes: Recipe[] = this.item()?.recipes ?? [];
        const workshop: Recipe[] = recipes.filter((recipe: Recipe): boolean => recipe.type === 'Recipe::WorkshopType');
        return recipes.filter((recipe: Recipe): boolean => recipe.type !== 'Recipe::WorkshopTypeTechSpecific'
            || !workshop.some((other: Recipe): boolean => sameComponents(other, recipe)
                && recipe.result.every((result: RecipeResultItem): boolean =>
                    other.result.some((other_result: RecipeResultItem): boolean => other_result.item?.uid === result.item?.uid))));
    });
    /** Propriétés à afficher : sans celles qui redonnent la catégorie ni l'appât, et une seule trouvaille, la plus petite qui donne l'objet. */
    protected readonly displayed_properties: Signal<Property[]> = computed((): Property[] => {
        const properties: Property[] = (this.item()?.properties ?? [])
            .filter((property: Property): boolean => !property || (property.value.category !== 'category' && !HIDDEN_PROPERTIES.includes(property.key)));
        const smallest_find: string | undefined = FIND_TIERS.find((key: string): boolean =>
            properties.some((property: Property): boolean => property?.key === key));
        return properties.filter((property: Property): boolean => !(property && FIND_TIERS.includes(property.key)) || property.key === smallest_find);
    });
    /** Propriétés affichées en icône seule, regroupées sur une ligne. */
    protected readonly icon_properties: Signal<Property[]> = computed((): Property[] =>
        this.displayed_properties().filter((property: Property): boolean => !!property?.value.icon_only));
    /** Chantiers qui donnent un bonus de veille à l'objet, regroupés sur une ligne. */
    protected readonly watch_bonus_properties: Signal<Property[]> = computed((): Property[] =>
        this.displayed_properties().filter((property: Property): boolean => property?.value.category === 'nightwatch'));
    /** Propriétés affichées avec leur libellé, une par ligne. */
    protected readonly text_properties: Signal<Property[]> = computed((): Property[] =>
        this.displayed_properties().filter((property: Property): boolean => !property?.value.icon_only && property?.value.category !== 'nightwatch'));
    /** Actions à libellé, sans la recharge que porte déjà la recette de recharge. */
    protected readonly displayed_actions: Signal<Action[]> = computed((): Action[] =>
        (this.item()?.actions ?? []).filter((action: Action | undefined): action is Action => !!action && action !== Action.LOAD_PILEGUN));
    /** Les chances de survie en veille s'additionnent-elles par exemplaire ? */
    protected readonly watch_cumulable: Signal<boolean> = computed((): boolean =>
        (this.item()?.properties ?? []).some((property: Property): boolean => property?.key === 'nw_impact_cumul'));
    /** Charges obtenues à la recharge, `null` pour un objet sans recharge. */
    protected readonly reload_summary: Signal<ReloadSummary | null> = computed((): ReloadSummary | null => {
        const charges: ChargeChance[] = [...(this.item()?.reload_charges ?? [])].sort((a: ChargeChance, b: ChargeChance): number => b.charges - a.charges);
        if (charges.length === 0) return null;
        return {
            min: charges[charges.length - 1].charges,
            max: charges[0].charges,
            detail: charges.map((chance: ChargeChance): string =>
                `${chance.charges} : ${formatNumber(chance.probability * 100, this.locale, '1.0-2')} %`).join(', ')
        };
    });
    protected town: TownDetails | null = getTown();
    private wishlist_services: WishlistService = inject(WishlistService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    public ngOnInit(): void {
        if (this.forceOpen()) {
            this.display_mode = 'advanced';
        }
    }

    /**
     * Ajoute un élément à la liste de souhaits
     *
     * @param {Item} item
     */
    protected addItemToWishlist(item: Item): void {
        this.wishlist_services.addItemToWishlist(item, 0)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(() => {
                // Mutation en place D'ABORD : préserve le partage de référence avec le tableau
                // canonique du parent (bank.component.ts/items.component.ts filtrent via `.filter()`,
                // qui conserve les références d'objet — un clone déconnecté désynchroniserait un
                // refiltrage ultérieur). `.set()` d'un clone ENSUITE : sous OnPush, `set()` ignore une
                // valeur `Object.is`-égale à l'actuelle, il faut donc une nouvelle référence pour que
                // le signal notifie son propre template.
                const current_item: Item = this.item();
                current_item.wishlist_count = 1;
                this.item.set(Object.assign(new Item(), current_item));
            });
    }

    /**
     * Libellé officiel de l'action, construit à l'appel pour suivre la langue active.
     *
     * @param {ItemActionEffects} effects
     * @returns {string}
     */
    protected actionLabel(effects: ItemActionEffects): string {
        switch (effects.kind) {
            case 'Open':
                return $localize`Ouvrir`;
            case 'Slaughter':
                return $localize`Découper`;
            case 'Purify':
                return effects.ap_cost === 1 ? $localize`Purifier (1PA)` : $localize`Purifier`;
            case 'Attack':
                return $localize`Attaquer avec`;
            default:
                return effects.action_name;
        }
    }

    protected toggleAdvancedMode(): void {
        if (this.selectable()) {
            this.itemSelected.emit(this.item());
            return;
        }
        if (this.forceOpen()) {
            this.display_mode = 'advanced';
        } else {
            this.display_mode = this.display_mode === 'simple' ? 'advanced' : 'simple';
        }
    }
}

