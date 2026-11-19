import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { BuildingPlanContentDTO, PlanCitizenDTO, PlanTownLineDTO, TownLineSource } from './plan.types';
import { CitizenRef } from './plan-evaluation.util';

/** Chance de réussite d'une sieste selon le niveau du Coin sieste (jeu : `home_rest_1/2/3`). */
const REST_SUCCESS_RATE: readonly number[] = [0, 1 / 3, 2 / 3, 1];

/** PA gagnés par une sieste réussie. */
const REST_AP: number = 2;

/** Chance de gagner 1 PA aux dés (brelan, suite, 4-2-1 : 36/216). */
const DICE_RATE: number = 1 / 6;

/** Chance de gagner 1 PA aux cartes (As, Dame de cœur, carte des règles : 6/54). */
const CARDS_RATE: number = 1 / 9;

/**
 * PA moyens d'une source pour des citoyens, arrondis en dessous sur le total.
 * @param {TownLineSource} source Source.
 * @param {readonly { upgradeLevels: ReadonlyMap<string, number> | null }[]} citizens Citoyens de la poche.
 * @returns {number} PA.
 */
export function sourcePa(source: TownLineSource, citizens: readonly { upgradeLevels: ReadonlyMap<string, number> | null }[]): number {
    let total: number;
    switch (source) {
        case 'rest':
            total = citizens.reduce((sum: number, citizen: { upgradeLevels: ReadonlyMap<string, number> | null }): number => {
                const level: number = citizen.upgradeLevels?.get(HomeEnum.REST_LEVEL.key) ?? 0;
                return sum + REST_AP * REST_SUCCESS_RATE[Math.min(Math.max(level, 0), REST_SUCCESS_RATE.length - 1)];
            }, 0);
            break;
        case 'dice':
            total = citizens.length * DICE_RATE;
            break;
        case 'cards':
            total = citizens.length * CARDS_RATE;
            break;
        case 'guitar':
            total = citizens.length;
            break;
    }
    return Math.floor(total + 1e-9);
}

/**
 * PA d'une ligne ville : valeur saisie pour une ligne libre ou forcée, sinon calcul de la source sur les citoyens de sa poche.
 * @param {PlanTownLineDTO} line Ligne.
 * @param {readonly CitizenRef[]} citizens Citoyens vivants de la ville.
 * @param {BuildingPlanContentDTO} content Contenu du plan (bannissements simulés).
 * @returns {number} PA de la ligne.
 */
export function resolveTownLinePa(line: PlanTownLineDTO, citizens: readonly CitizenRef[], content: BuildingPlanContentDTO): number {
    if (line.source === undefined || line.source === null || line.manual === true) {
        return line.pa;
    }
    const pool_citizens: CitizenRef[] = citizens.filter((citizen: CitizenRef): boolean => {
        const entry: PlanCitizenDTO | undefined = content.citizens.find((candidate: PlanCitizenDTO): boolean => candidate.userId === citizen.userId);
        return (entry?.banned ?? citizen.banned) === (line.pool === 'banned');
    });
    return sourcePa(line.source, pool_citizens);
}
