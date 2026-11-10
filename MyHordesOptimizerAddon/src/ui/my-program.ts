import { loadBuildingPlans, loadBuildingRefs, loadBuildingStates } from '../api/building-plans';
import { getCitizens } from '../api/citizens';
import { getMyExpeditions } from '../api/expeditions';
import { mho_expeditions_window_id } from '../config/constants';
import { state } from '../state';
import type { ApiCitizen, ApiExpedition } from '../types';
import type { ApiBuildingPlan, ApiBuildingPlans, ApiBuildingRef, TownBuildingState } from '../types/building-plan';
import { effectivePlan, programText, SLAVERY_UID, withTaskIds } from '../utils/my-program';
import { addError } from '../utils/notifications';
import { townPosition } from './expedition-route';
import { buildingsTabCount, type BuildingsTabData, createBuildingsTab } from './my-program-buildings';
import { createExpeditionTab } from './my-program-expedition';
import { createSmallUpdateExternalToolsButton } from './update-button';

/** Fenêtre « Mon programme » : en-tête (titre du jour, Actualiser, Mettre à jour) puis onglets Expédition et Chantiers. */

type ProgramTab = 'expedition' | 'buildings';

/** Réponse de `getCitizens` (seul champ lu ici) */
interface CitizensResponse {
    citizens: ApiCitizen[];
}

type ProgramLoads = [
    PromiseSettledResult<ApiExpedition[]>,
    PromiseSettledResult<CitizensResponse>,
    PromiseSettledResult<ApiBuildingPlans | null>,
    PromiseSettledResult<TownBuildingState[]>,
    PromiseSettledResult<ApiBuildingRef[]>
];

const tab_order: readonly ProgramTab[] = ['expedition', 'buildings'];
const update_tooltip_id: string = 'mho-program-update-tooltip';

/** Onglet ouvert, gardé d'un chargement à l'autre */
let selected_tab: ProgramTab = 'expedition';
/** Expédition choisie dans la liste, gardée de même (nulle : la première) */
let selected_expedition_id: number | null = null;
/** Numéro du dernier chargement lancé : un chargement dépassé ne rend rien */
let last_load: number = 0;

/** Valeur d'un chargement réussi, `undefined` en cas d'échec. */
function settledValue<T>(result: PromiseSettledResult<T>): T | undefined {
    return result.status === 'fulfilled' ? result.value : undefined;
}

/** Titre « Mon programme — J<jour> », sans jour hors ville. */
function programTitle(day: number | undefined): string {
    return typeof day === 'number' ? `${programText('title')} — ${programText('day_label').replace('{day}', String(day))}` : programText('title');
}

/** En-tête créé une seule fois : le bouton Mettre à jour y garde le résultat de sa dernière mise à jour. */
function programHeader(window_content: HTMLElement): HTMLElement {
    const existing: HTMLElement | null = window_content.querySelector(':scope > .mho-program-header');
    if (existing !== null) return existing;

    const header: HTMLDivElement = document.createElement('div');
    header.classList.add('mho-program-header');
    const title: HTMLHeadingElement = document.createElement('h3');
    title.classList.add('mho-program-title');
    const reload: HTMLDivElement = document.createElement('div');
    reload.classList.add('mho-expedition-route-reload');
    reload.setAttribute('role', 'button');
    reload.title = programText('refresh');
    reload.textContent = '🗘';
    reload.addEventListener('click', (): void => {
        void openMyProgram();
    });
    const update: HTMLElement = createSmallUpdateExternalToolsButton(null, {
        id: null,
        tooltip_id: update_tooltip_id,
        on_done: (): void => {
            void openMyProgram();
        }
    });
    header.append(title, reload, update);
    return header;
}

/** Données de l'onglet Chantiers, nulles sans citoyens, plans ou référentiel ; sans état des chantiers, aucune étape n'est marquée faite. */
function buildingsData(citizens: CitizensResponse | undefined, plans: ApiBuildingPlans | null | undefined, states: TownBuildingState[] | undefined, refs: ApiBuildingRef[] | undefined, day: number | undefined): BuildingsTabData | null {
    if (citizens === undefined || plans === undefined || refs === undefined) return null;
    const states_by_id: Map<number, TownBuildingState> = new Map<number, TownBuildingState>((states ?? []).map((building: TownBuildingState): [number, TownBuildingState] => [building.buildingId, building]));
    const slavery_id: number | undefined = refs.find((ref: ApiBuildingRef): boolean => ref.uid === SLAVERY_UID)?.id;
    const plan: ApiBuildingPlan | null = plans !== null && typeof day === 'number' ? effectivePlan(plans.plans, day) : null;
    return {
        access_citizen: plans?.access.isCitizen === true,
        plan: plan === null ? null : { ...plan, content: withTaskIds(plan.content, plan.id) },
        me: citizens.citizens.find((citizen: ApiCitizen): boolean => citizen.id === state.mh_user?.id),
        states: states_by_id,
        refs: new Map<number, ApiBuildingRef>(refs.map((ref: ApiBuildingRef): [number, ApiBuildingRef] => [ref.id, ref])),
        /** Sans jour connu, il n'y a pas de plan : le jour n'est pas lu */
        day: day ?? 0,
        house_editable: state.mh_user?.townDetails?.hasExternalApi === false,
        slavery_built: slavery_id !== undefined && states_by_id.get(slavery_id)?.isBuilt === true
    };
}

/**
 * Charge expéditions, citoyens, plans, état et référentiel des chantiers, puis rend la fenêtre en gardant l'onglet ouvert ; un échec laisse son onglet vide.
 * @param {boolean} from_header Ouverture par le bouton de l'en-tête du jeu : l'onglet Expédition et la première expédition sont rouverts.
 */
export async function openMyProgram(from_header: boolean = false): Promise<void> {
    if (from_header) {
        selected_tab = 'expedition';
        selected_expedition_id = null;
    }
    const load: number = ++last_load;
    const [expeditions, citizens, plans, states, refs]: ProgramLoads = await Promise.allSettled([
        getMyExpeditions(),
        getCitizens(true) as Promise<CitizensResponse>,
        loadBuildingPlans(),
        loadBuildingStates(),
        loadBuildingRefs()
    ]);
    /** Expéditions et citoyens notifient déjà leurs erreurs */
    [plans, states, refs].forEach((result: PromiseSettledResult<unknown>): void => {
        if (result.status === 'rejected') addError(result.reason);
    });
    const window_content: HTMLElement | null = document.getElementById(`${mho_expeditions_window_id}-content`);
    if (load !== last_load || window_content === null) return;

    const day: number | undefined = state.mh_user?.townDetails?.day;
    const user_id: number | undefined = state.mh_user?.id;
    const expedition_list: ApiExpedition[] | undefined = settledValue(expeditions);
    const citizen_list: CitizensResponse | undefined = settledValue(citizens);
    const buildings: BuildingsTabData | null = buildingsData(citizen_list, settledValue(plans), settledValue(states), settledValue(refs), day);
    const count: string | null = buildings === null ? null : buildingsTabCount(buildings);
    const labels: Record<ProgramTab, string> = {
        expedition: programText('tab_expedition'),
        buildings: count === null ? programText('tab_buildings') : `${programText('tab_buildings')} · ${count}`
    };
    const panels: Record<ProgramTab, HTMLElement> = {
        expedition: expedition_list === undefined || user_id === undefined
            ? document.createElement('div')
            : createExpeditionTab(expedition_list, citizen_list?.citizens ?? [], user_id, townPosition(), selected_expedition_id, (id: number): void => {
                selected_expedition_id = id;
            }),
        buildings: buildings === null
            ? document.createElement('div')
            : createBuildingsTab(buildings, (): void => {
                void openMyProgram();
            })
    };

    const header: HTMLElement = programHeader(window_content);
    (header.querySelector('.mho-program-title') as HTMLElement).textContent = programTitle(day);

    const tab_content: HTMLDivElement = document.createElement('div');
    tab_content.classList.add('tab-content');
    const tabs_ul: HTMLUListElement = document.createElement('ul');
    const items: HTMLLIElement[] = tab_order.map((tab: ProgramTab): HTMLLIElement => {
        const link: HTMLDivElement = document.createElement('div');
        link.textContent = labels[tab];
        const item: HTMLLIElement = document.createElement('li');
        item.appendChild(link);
        item.addEventListener('click', (): void => {
            selected_tab = tab;
            show();
        });
        return item;
    });
    /** Affiche l'onglet ouvert */
    const show = (): void => {
        items.forEach((item: HTMLLIElement, index: number): void => {
            item.classList.toggle('selected', tab_order[index] === selected_tab);
        });
        tab_content.replaceChildren(panels[selected_tab]);
    };
    tabs_ul.append(...items);
    const tabs_div: HTMLDivElement = document.createElement('div');
    tabs_div.id = 'tabs';
    tabs_div.appendChild(tabs_ul);

    window_content.replaceChildren(header, tabs_div, tab_content);
    show();
}
