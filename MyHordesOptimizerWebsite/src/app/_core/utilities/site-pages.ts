/** Identifiant d'une page (ou d'une rubrique) du site. */
export type SitePageId =
    | 'town' | 'townReturn' | 'townMap' | 'townBank' | 'townCitizens' | 'townWishlist' | 'townStats' | 'townExpeditions'
    | 'townBuildings' | 'townNightwatch' | 'townCampings' | 'townProgram'
    | 'tools' | 'toolsCamping' | 'toolsProbabilities' | 'toolsOverflow' | 'toolsStateManager'
    | 'directory' | 'directoryCitizens' | 'directoryTowns'
    | 'wiki' | 'wikiItems' | 'wikiRecipes' | 'wikiHeroSkills' | 'wikiRuins' | 'wikiBuildings' | 'wikiMiscellaneousInfo' | 'wikiPrivateTowns'
    | 'tutorials'
    | 'games' | 'games368Pictos' | 'gamesMinesweeper';

/** Libellé et icône d'une page, partagés par le menu, la recherche globale et l'en-tête de la page. */
export interface SitePage {
    readonly label: string;
    /** Chemin relatif à `HORDES_IMG_REPO` ; non défini = aucune icône affichée. */
    readonly icon: string | undefined;
}

/**
 * Libellé et icône d'une page du site.
 *
 * Les libellés sont construits à l'appel, jamais au chargement du module : `main.ts` importe l'application avant de
 * charger les traductions, une constante resterait en français.
 * @param {SitePageId} id Page voulue.
 * @returns {SitePage} Libellé traduit et icône de la page.
 */
export function sitePage(id: SitePageId): SitePage {
    return sitePages()[id];
}

/**
 * Registre des pages du site.
 * @returns {Record<SitePageId, SitePage>} Toutes les pages, par identifiant.
 */
function sitePages(): Record<SitePageId, SitePage> {
    return {
        town: { label: $localize`Ma ville`, icon: undefined },
        townReturn: { label: $localize`Revenir à ma ville`, icon: undefined },
        townMap: { label: $localize`Carte`, icon: undefined },
        townBank: { label: $localize`Banque`, icon: undefined },
        townCitizens: { label: $localize`Citoyens`, icon: undefined },
        townWishlist: { label: $localize`Liste de courses`, icon: undefined },
        townStats: { label: $localize`Statistiques`, icon: undefined },
        townExpeditions: { label: $localize`Expéditions`, icon: undefined },
        townBuildings: { label: $localize`Chantiers`, icon: undefined },
        townNightwatch: { label: $localize`Veilles`, icon: undefined },
        townCampings: { label: $localize`Campings`, icon: undefined },
        townProgram: { label: $localize`Mon programme`, icon: undefined },
        tools: { label: $localize`Outils`, icon: undefined },
        toolsCamping: { label: $localize`Camping`, icon: undefined },
        toolsProbabilities: { label: $localize`Chances de survie`, icon: undefined },
        toolsOverflow: { label: $localize`Simulateur de débordement`, icon: undefined },
        toolsStateManager: { label: $localize`Gestionnaire d'état`, icon: undefined },
        directory: { label: $localize`Annuaire`, icon: undefined },
        directoryCitizens: { label: $localize`Citoyens`, icon: undefined },
        directoryTowns: { label: $localize`Villes`, icon: undefined },
        wiki: { label: $localize`Wiki`, icon: undefined },
        wikiItems: { label: $localize`Objets`, icon: undefined },
        wikiRecipes: { label: $localize`Recettes`, icon: undefined },
        wikiHeroSkills: { label: $localize`Pouvoirs`, icon: undefined },
        // « Bâtiments » désigne les bâtiments d'EXTÉRIEUR (les ruines) ; les constructions en ville portent leur nom
        // du jeu, « Chantiers », pour que les deux pages ne soient pas homonymes.
        wikiRuins: { label: $localize`Bâtiments`, icon: undefined },
        wikiBuildings: { label: $localize`Chantiers`, icon: undefined },
        wikiMiscellaneousInfo: { label: $localize`Informations diverses`, icon: undefined },
        wikiPrivateTowns: { label: $localize`Villes privées`, icon: undefined },
        tutorials: { label: $localize`Tutoriels`, icon: undefined },
        games: { label: $localize`Mini-Jeux`, icon: undefined },
        games368Pictos: { label: $localize`368 Pictos`, icon: undefined },
        gamesMinesweeper: { label: $localize`Démineur`, icon: undefined }
    };
}
