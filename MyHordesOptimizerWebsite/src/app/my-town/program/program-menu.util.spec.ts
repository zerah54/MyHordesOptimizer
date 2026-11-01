import { CitizenDTO } from '../../_abstract_model/dto/citizen.dto';
import { CitizenExpeditionDTO } from '../../_abstract_model/dto/citizen-expedition.dto';
import { DailyProgramFactsDTO } from '../../_abstract_model/dto/daily-program-facts.dto';
import { isProgramMenuVisible } from './program-menu.util';

const DAY: number = 5;

function citizen(overrides: Partial<CitizenDTO> = {}): CitizenDTO {
    return <CitizenDTO>{ id: 1, name: 'Moi', dailyActions: [], ...overrides };
}

function place(overrides: Partial<CitizenExpeditionDTO> = {}): CitizenExpeditionDTO {
    return <CitizenExpeditionDTO>{ orders: [], preinscrit: false, pdc: 0, ...overrides };
}

function facts(overrides: Partial<DailyProgramFactsDTO> = {}): DailyProgramFactsDTO {
    return { isCitizen: true, hasEffectivePlan: false, isPlaced: false, openPlaces: [], me: citizen(), ...overrides };
}

describe('isProgramMenuVisible', () => {
    it('cache tout pour un non-citoyen, même avec un plan effectif', () => {
        expect(isProgramMenuVisible(facts({ isCitizen: false, hasEffectivePlan: true }), DAY, false)).toBe(false);
    });

    it('affiche avec un plan effectif', () => {
        expect(isProgramMenuVisible(facts({ hasEffectivePlan: true }), DAY, false)).toBe(true);
    });

    it('affiche quand je suis placé', () => {
        expect(isProgramMenuVisible(facts({ isPlaced: true }), DAY, false)).toBe(true);
    });

    it('affiche avec une place libre sans exigence', () => {
        expect(isProgramMenuVisible(facts({ openPlaces: [place()] }), DAY, false)).toBe(true);
    });

    it('ignore une place réservée à un autre métier', () => {
        const dto: DailyProgramFactsDTO = facts({ openPlaces: [place({ preinscritJob: 'vest' })], me: citizen({ jobUid: 'shield' }) });
        expect(isProgramMenuVisible(dto, DAY, false)).toBe(false);
    });

    it('ignore une place qui exige des chaussures que je n\'ai pas', () => {
        const dto: DailyProgramFactsDTO = facts({ openPlaces: [place({ isPreinscritChaussures: true })], me: citizen({ shoesEquipped: false }) });
        expect(isProgramMenuVisible(dto, DAY, false)).toBe(false);
    });

    it('ignore les places sans citoyen connu', () => {
        expect(isProgramMenuVisible(facts({ openPlaces: [place()], me: null }), DAY, false)).toBe(false);
    });
});
