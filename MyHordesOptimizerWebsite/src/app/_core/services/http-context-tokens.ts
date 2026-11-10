import { HttpContextToken } from '@angular/common/http';

/**
 * Isolés dans ce fichier neutre (sans dépendre d'aucun service) pour casser le cycle
 * _global.service.ts → *-interceptor.service.ts → authentication.service.ts → _global.service.ts,
 * qui n'apparaît qu'au bundling de test Karma (résolution DI paresseuse en production).
 */

/** Laisse l'erreur remonter telle quelle, sans message ni tentative de reconnexion */
export const BYPASS_ERROR: HttpContextToken<boolean> = new HttpContextToken(() => false);

/** Comme BYPASS_ERROR, pour ce ou ces statuts : l'abonné les gère et les affiche lui-même */
export const SILENT_ERROR_STATUS: HttpContextToken<number | readonly number[] | null> = new HttpContextToken<number | readonly number[] | null>(() => null);

export const BYPASS_LOADING: HttpContextToken<boolean> = new HttpContextToken(() => false);
