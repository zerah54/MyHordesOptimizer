import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import { PlanningDataService, PlanningDay, PlanningStatic } from '../../_abstract_model/services/planning-data.service';
import { NightwatchAttackService } from './nightwatch-attack.service';

function statics(plans: Array<{ day: number; isEffective: boolean; attackOverride: number | null }>): PlanningStatic {
    return {
        plans: { access: { isCitizen: true, canEdit: true }, plans: plans.map((plan: { day: number; isEffective: boolean; attackOverride: number | null }): unknown => ({
            id: 1, day: plan.day, name: 'P', isEffective: plan.isEffective, content: { attackOverride: plan.attackOverride }
        })) }
    } as unknown as PlanningStatic;
}

describe('NightwatchAttackService', (): void => {
    let load_static: ReturnType<typeof vi.fn>;
    let load_day: ReturnType<typeof vi.fn>;

    function service(): NightwatchAttackService {
        TestBed.configureTestingModule({ providers: [{ provide: PlanningDataService, useValue: { loadStatic: load_static, loadDay: load_day } }] });
        return TestBed.inject(NightwatchAttackService);
    }

    async function attack(day: number): Promise<number | null> {
        return new Promise<number | null>((resolve: (value: number | null) => void): void => {
            service().attackOfDay(day).subscribe((value: number | null): void => resolve(value));
        });
    }

    beforeEach((): void => {
        load_static = vi.fn((): Observable<PlanningStatic> => of(statics([])));
        load_day = vi.fn((): Observable<PlanningDay> => of({ expeditions: [], attack: null }));
    });

    afterEach((): void => {
        TestBed.resetTestingModule();
    });

    it('surcharge du plan de chantiers effectif du jour, sans charger l\'estimation', async (): Promise<void> => {
        load_static.mockReturnValue(of(statics([{ day: 10, isEffective: true, attackOverride: 700 }])));

        expect(await attack(10)).toBe(700);
        expect(load_day).not.toHaveBeenCalled();
    });

    it('un plan de chantiers non effectif ou d\'un autre jour est ignoré : repli sur l\'estimation', async (): Promise<void> => {
        load_static.mockReturnValue(of(statics([{ day: 10, isEffective: false, attackOverride: 700 }, { day: 11, isEffective: true, attackOverride: 800 }])));
        load_day.mockReturnValue(of({ expeditions: [], attack: 650 }));

        expect(await attack(10)).toBe(650);
        expect(load_day).toHaveBeenCalledWith(10);
    });

    it('aucun résultat : null', async (): Promise<void> => {
        expect(await attack(10)).toBeNull();
    });

    it('échec de chargement : null, jamais d\'erreur', async (): Promise<void> => {
        load_static.mockReturnValue(throwError((): Error => new Error('api')));

        expect(await attack(10)).toBeNull();
    });
});
