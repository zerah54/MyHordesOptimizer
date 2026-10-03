import { environment } from '../../../environments/environment';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { TownContextService } from '../../_core/services/town-context.service';
import { getTown, getUser } from '../../_core/utilities/localstorage.util';

/**
 * Entrée du menu latéral.
 *
 * Partagée avec la recherche globale de l'en-tête, qui indexe les mêmes pages : une page ajoutée
 * au menu devient trouvable sans autre déclaration.
 */
export interface SidenavLinks {
    label: string;
    path?: string;
    /** Suffixe relatif à la ville (map, bank, …) : le chemin complet est calculé selon le contexte. */
    townSuffix?: string;
    /** Section racine « Ma ville » : son libellé devient le nom de la ville observée en observation. */
    isTownRoot?: boolean;
    /** Entrée « Revenir à ma ville », affichée seulement en mode observateur. */
    returnHome?: boolean;
    children?: SidenavLinks[];
    lvl?: number;
    displayed: boolean;
    authorized: () => boolean;
    expanded?: boolean;
    spoil: boolean;
}

/**
 * Arborescence du menu latéral.
 *
 * Une fabrique et non une constante : le menu mute `displayed` et `expanded` sur ses entrées, et
 * la recherche globale ne doit ni voir ces changements ni les provoquer. Chacun a son exemplaire.
 */
export function buildSidenavLinks(town_context: TownContextService): SidenavLinks[] {
    return [
        {
            label: $localize`Ma ville`, lvl: 0, displayed: true, isTownRoot: true, authorized: (): boolean => isInTown(), expanded: true, children: [
                { label: $localize`Revenir à ma ville`, returnHome: true, displayed: true, lvl: 1, authorized: (): boolean => town_context.isReadonly(), spoil: false },
                { label: $localize`Carte`, townSuffix: 'map', displayed: true, lvl: 1, authorized: (): boolean => isInTown(), spoil: false },
                { label: $localize`Banque`, townSuffix: 'bank', displayed: true, lvl: 1, authorized: (): boolean => isInTown(), spoil: false },
                { label: $localize`Citoyens`, townSuffix: 'citizens', displayed: true, lvl: 1, authorized: (): boolean => isInTown(), spoil: false },
                {
                    label: $localize`Liste de courses`,
                    townSuffix: 'wishlist',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => isInTown(),
                    spoil: false
                },
                { label: $localize`Statistiques`, townSuffix: 'stats', displayed: true, lvl: 1, authorized: (): boolean => isInTown(), spoil: false },
                { label: $localize`Expéditions`, townSuffix: 'expeditions', displayed: true, lvl: 1, authorized: (): boolean => isInTown(), spoil: false },
                {
                    label: $localize`Chantiers`,
                    townSuffix: 'buildings',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => isInTown() && !environment.production,
                    spoil: false
                },
                {
                    label: $localize`Veilles`,
                    townSuffix: 'nightwatch',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => isInTown() && !environment.production,
                    spoil: false
                },
                {
                    label: $localize`Campings`,
                    townSuffix: 'campings',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => isInTown() && !environment.production,
                    spoil: false
                },
            ], spoil: false
        },
        {
            label: $localize`Outils`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: true, children: [
                { label: $localize`Camping`, path: 'tools/camping', displayed: true, lvl: 1, authorized: (): boolean => true, spoil: false },
                { label: $localize`Chances de survie`, path: 'tools/probabilities', displayed: true, lvl: 1, authorized: (): boolean => true, spoil: false },
                { label: $localize`Simulateur de débordement`, path: 'tools/overflow', displayed: true, lvl: 1, authorized: (): boolean => true, spoil: false },
                { label: $localize`Gestionnaire d'état`, path: 'tools/state-manager', displayed: true, lvl: 1, authorized: (): boolean => true, spoil: false },
            ], spoil: false
        },
        {
            label: $localize`Annuaire`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: false, children: [
                { label: $localize`Citoyens`, path: 'directory/citizens', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: false },
                { label: $localize`Villes`, path: 'directory/towns', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: false },
            ], spoil: false
        },
        {
            label: $localize`Wiki`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: false, children: [
                { label: $localize`Objets`, path: 'wiki/items', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: true },
                { label: $localize`Recettes`, path: 'wiki/recipes', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: true },
                { label: $localize`Pouvoirs`, path: 'wiki/hero-skills', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: false },
                // « Bâtiments » désigne ici les bâtiments d'EXTÉRIEUR (les ruines). Les constructions
                // en ville portent leur nom du jeu, « Chantiers », pour que les deux entrées ne
                // soient pas homonymes.
                { label: $localize`Bâtiments`, path: 'wiki/ruins', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: true },
                { label: $localize`Chantiers`, path: 'wiki/buildings', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: true },
                {
                    label: $localize`Informations diverses`,
                    path: 'wiki/miscellaneous-info',
                    displayed: false,
                    lvl: 1,
                    authorized: (): boolean => true,
                    spoil: false
                },
                {
                    label: $localize`Villes privées`,
                    path: 'wiki/private-towns',
                    displayed: false,
                    lvl: 1,
                    authorized: (): boolean => true,
                    spoil: false
                }
            ], spoil: false
        },
        {
            label: $localize`Tutoriels`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: false, children: [
                {
                    label: $localize`Script / Extension`, displayed: false, lvl: 1, authorized: (): boolean => true, expanded: false, children: [
                        tutorialLink($localize`Installation`, 'script-extension/installation'),
                        tutorialLink($localize`Prise en main`, 'script-extension/getting-started'),
                        tutorialLink($localize`Outils`, 'script-extension/tools'),
                        tutorialLink($localize`Wiki`, 'script-extension/wiki'),
                        tutorialLink($localize`Outils externes`, 'script-extension/external-tools'),
                        tutorialLink($localize`Informations complémentaires`, 'script-extension/additional-info'),
                        tutorialLink($localize`Améliorations de l'interface`, 'script-extension/display'),
                        tutorialLink($localize`Forum`, 'script-extension/forum'),
                        tutorialLink($localize`Notifications`, 'script-extension/alerts')
                    ], spoil: false
                },
                {
                    label: $localize`Site`, displayed: false, lvl: 1, authorized: (): boolean => true, expanded: false, children: [
                        tutorialLink($localize`Première utilisation`, 'site/first-use'),
                        tutorialLink($localize`Ma ville`, 'site/my-town'),
                        tutorialLink($localize`Outils`, 'site/tools'),
                        tutorialLink($localize`Wiki`, 'site/wiki'),
                        tutorialLink($localize`Annuaire et observation`, 'site/directory'),
                        tutorialLink($localize`Mini-jeux`, 'site/games'),
                        tutorialLink($localize`Compte et préférences`, 'site/account')
                    ], spoil: false
                },
                {
                    label: $localize`Bot Discord`, displayed: false, lvl: 1, authorized: (): boolean => true, expanded: false, children: [
                        tutorialLink($localize`Installation`, 'discord-bot/installation'),
                        tutorialLink($localize`Commandes`, 'discord-bot/commands')
                    ], spoil: false
                },
            ], spoil: false
        },
        {
            label: $localize`Mini-Jeux`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: false, children: [
                { label: $localize`368 Pictos`, path: 'games/368-pictos', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: false },
                { label: $localize`Démineur`, path: 'games/minesweeper', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: false },
            ], spoil: false
        },
    ];
}

/** Résout le lien d'une entrée en tenant compte du contexte d'observation. */
export function resolveSidenavPath(route: SidenavLinks, town_context: TownContextService): string | undefined {
    if (route.returnHome) return returnPath();
    if (route.townSuffix) return `${townBasePath(town_context)}/${route.townSuffix}`;
    return route.path;
}

/** Résout le libellé : la section ville prend le nom de la ville observée en mode observateur. */
export function resolveSidenavLabel(route: SidenavLinks, town_context: TownContextService): string {
    if (route.isTownRoot && town_context.isReadonly()) {
        return town_context.observedTownName() ?? $localize`Ville observée`;
    }
    return route.label;
}

/** Base des liens de la section ville : la ville observée en mode observateur, sinon la sienne. */
export function townBasePath(town_context: TownContextService): string {
    const observed: TownDetails | null = town_context.observedTown();
    return observed ? `town/${observed.town_id}` : 'my-town';
}

function isInTown(): boolean {
    if (!environment.production) return true;
    const town: TownDetails | null = getTown();
    if (!town) return false;
    return town.town_id !== null && town.town_id !== undefined && town.town_id !== 0;
}

/** Destination du bouton retour : sa propre ville si elle existe, sinon la liste des villes. */
function returnPath(): string {
    return getUser()?.town_details?.town_id ? 'my-town' : 'directory/towns';
}

/** Entrée de niveau 2 du groupe « Tutoriels ». */
function tutorialLink(label: string, path: string): SidenavLinks {
    return { label, path: `tutorials/${path}`, displayed: false, lvl: 2, authorized: (): boolean => true, spoil: false };
}
