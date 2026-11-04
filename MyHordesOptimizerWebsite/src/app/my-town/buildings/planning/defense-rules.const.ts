/**
 * Règles de défense des chantiers à effet indirect, ÉCRITES EN DUR ici.
 *
 * Ce sont des règles de calcul codées dans le PHP de MyHordes, pas des données de fixtures : l'extracteur (`Scripts/Extractor`)
 * ne peut pas les relever. Les gains d'évolution par niveau (Cimetière 3 / 7 / 14, Ajustement défensif 1,10 → 1,13…) ne sont PAS
 * ici : ils viennent des données extraites (DEF-6 du suivi).
 *
 * Où vérifier dans le code d'origine (https://gitlab.com/eternaltwin/myhordes/myhordes, relu sur `master` @ 7ffc3e9e, 01/11/2026) :
 * - `src/Service/TownHandler.php`, `calculate_home_def()` : défense d'une maison (Habitations fortifiées) ;
 * - `src/Service/TownHandler.php`, `calculate_town_def()` : défense de la ville (pourcentage des maisons, objets de défense,
 *   Fixations de défenses, Cimetière et Cercueils, échelle globale) ;
 * - `src/EventListener/Game/Town/Basic/Buildings/BuildingQueryListener.php`, `OverallTownDefenseScale` : échelle de l'Ajustement défensif.
 * Les numéros de ligne ci-dessous valent pour ce commit : en cas de doute après une mise à jour du jeu, chercher l'extrait cité.
 */

/**
 * Habitations fortifiées : +4 de défense à la maison de chaque citoyen vivant.
 * `calculate_home_def()` (l. 280) : `if ($this->getBuilding($town, 'small_city_up_#00', true)) $summary->house_defense += 4;`
 */
export const FORTIFIED_HOMES_UID: string = 'small_city_up_#00';
export const FORTIFIED_HOMES_BONUS: number = 4;

/**
 * Quartiers circulaires : la ville compte 80 % de la défense des maisons au lieu de 40 % (arrondi à l'inférieur sur la somme).
 * `calculate_town_def()` (l. 359) : `$home_def_factor = $this->getBuilding( $town, 'small_strategy_#00', true ) ? 0.8 : 0.4;`
 */
export const CIRCULAR_QUARTERS_UID: string = 'small_strategy_#00';
export const HOME_DEFENSE_FACTOR: number = 0.4;
export const HOME_DEFENSE_FACTOR_CIRCULAR: number = 0.8;

/**
 * Fixations de défenses : chaque objet de défense de la banque (propriété `defence`) vaut 1 × un multiplicateur de
 * 1 + (1 + niveau) × 0,5 ; total de la banque arrondi à l'inférieur.
 * `calculate_town_def()` (l. 395) : `if (... === 'item_meca_parts_#00') $item_def_factor += (1+$building->getLevel()) * 0.5;`
 * puis (l. 412-413) : `floor(countSpecificItems($town->getBank(), $this->getPrototypesForDefenceItems(), ...) * $item_def_factor)`.
 */
export const DEFENSE_FIXINGS_UID: string = 'item_meca_parts_#00';
export const DEFENSE_FIXINGS_STEP: number = 0.5;

/**
 * Cercueils sur ressorts : +10 de défense par citoyen mort, ajoutés au ratio du Cimetière (qui doit donc être construit).
 * `calculate_town_def()` (l. 403-404) : `if ($this->getBuilding($town, 'small_coffin_#00')) $ratio += 10;`
 */
export const COFFINS_UID: string = 'small_coffin_#00';
export const COFFINS_BONUS_PER_DEAD: number = 10;

/**
 * Cimetière cadenassé : défense par mort selon son niveau, `match($building->getLevel()) { 0 => 3, 1 => 7, default => 14 }`
 * (`calculate_town_def()`, l. 397-401). Ratio = gain d'évolution : vient des données extraites (DEF-6), pas d'ici.
 */
export const CEMETERY_UID: string = 'small_cemetery_#00';

/** Ajustement défensif : échelle de toute la défense selon son niveau, donnée d'évolution (`OverallTownDefenseScale`). */
export const DEFENSE_ADJUSTMENT_UID: string = 'item_shield_#00';

/**
 * Chantiers dont l'effet s'applique à d'autres chantiers. Un enfant ne se construisant qu'après ses ancêtres, son gain affiché
 * suppose construits ceux de ses ancêtres qui figurent ici (Cercueils sous le Cimetière, Quartiers circulaires sous
 * Habitations fortifiées).
 */
export const CASCADE_EFFECT_UIDS: ReadonlySet<string> = new Set<string>([
    CEMETERY_UID, DEFENSE_ADJUSTMENT_UID, DEFENSE_FIXINGS_UID, FORTIFIED_HOMES_UID, CIRCULAR_QUARTERS_UID
]);
