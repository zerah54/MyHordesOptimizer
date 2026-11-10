import type { ApiExpeditionCitizen } from '../types';

/** Symbole de comparaison d'un opérateur de PE de départ ; « au moins » par défaut. */
function spOperatorSymbol(operator: ApiExpeditionCitizen['nombrePeDepartOperator']): string {
    switch (operator) {
        case 'max':
            return '≤';
        case 'exact':
            return '=';
        default:
            return '≥';
    }
}

/** Textes des colonnes « PE » et « Chaussures » d'une place : vides quand la place n'impose rien. */
export function requirementCells(place: ApiExpeditionCitizen): { sp: string; shoes: string } {
    const sp_count: number | null | undefined = place.nombrePeDepart;
    const shoes: boolean | null | undefined = place.isPreinscritChaussures;

    return {
        sp: typeof sp_count === 'number' ? `${spOperatorSymbol(place.nombrePeDepartOperator)} ${sp_count}` : '',
        shoes: shoes === true ? '✓' : shoes === false ? '✗' : ''
    };
}
