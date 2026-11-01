import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { Home } from '../../../_abstract_model/types/home.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { setTown } from '../../../_core/utilities/localstorage.util';
import { TaskCheckService } from './task-check.service';
import { homeLevelOf } from './task-status.util';

const DAY: number = 5;

describe('TaskCheckService', (): void => {
    let service: TaskCheckService;
    let add_daily: ReturnType<typeof vi.fn>;
    let remove_daily: ReturnType<typeof vi.fn>;
    let update_home: ReturnType<typeof vi.fn>;
    /** Citoyen tel que relu sur le serveur avant d'écrire une amélioration. */
    let fresh: Citizen;

    /**
     * Citoyen avec une maison donnée.
     * @param {Record<string, number | boolean>} home Valeurs par clé `HomeEnum`.
     * @returns {Citizen} Citoyen.
     */
    function citizen(home: Record<string, number | boolean> = {}): Citizen {
        const result: Citizen = Object.assign(new Citizen(), { id: 3, name: 'Chloé', daily_actions: [] as DailyAction[] });
        result.home = Object.assign(new Home(), {
            update_info: new UpdateInfo(),
            content: Object.entries(home).map(([key, value]: [string, number | boolean]): { element: HomeEnum; value: number | boolean } => ({ element: HomeEnum.getByKey<HomeEnum>(key) as HomeEnum, value }))
        });
        return result;
    }

    beforeEach((): void => {
        add_daily = vi.fn((): Observable<UpdateInfo> => of(new UpdateInfo()));
        remove_daily = vi.fn((): Observable<void> => of(undefined));
        update_home = vi.fn((): Observable<UpdateInfo> => of(new UpdateInfo()));
        fresh = citizen();
        TestBed.configureTestingModule({
            providers: [{
                provide: TownService,
                useValue: {
                    addDailyAction: add_daily, removeDailyAction: remove_daily, updateHomeFields: update_home, publishMyCitizen: vi.fn(),
                    getCitizen: (): Observable<Citizen> => of(fresh)
                }
            }]
        });
        service = TestBed.inject(TaskCheckService);
    });

    it('action de chantier : coche l\'action quotidienne du jour et la reflète sur le citoyen', (): void => {
        const target: Citizen = citizen();
        service.setDone(target, { id: 'a', kind: 'action', ref: 'home_crows', pa: 1 }, true, DAY).subscribe();

        expect(add_daily).toHaveBeenCalledWith(target, 'home_crows', DAY);
        expect(target.daily_actions.map((action: DailyAction): string => `${action.day}:${action.action_key}`)).toEqual([`${DAY}:home_crows`]);
    });

    it('action de chantier : décocher retire l\'action du jour', (): void => {
        const target: Citizen = citizen();
        target.daily_actions = [Object.assign(new DailyAction(), { day: DAY, action_key: 'home_crows' })];
        service.setDone(target, { id: 'a', kind: 'action', ref: 'home_crows', pa: 1 }, false, DAY).subscribe();

        expect(remove_daily).toHaveBeenCalledWith(target, 'home_crows', DAY);
        expect(target.daily_actions).toEqual([]);
    });

    it('amélioration : n\'écrit que le champ visé, au niveau visé', (): void => {
        const target: Citizen = citizen({ kitchenLevel: 1, laboLevel: 4 });
        fresh = citizen({ kitchenLevel: 1, laboLevel: 4 });
        service.setDone(target, { id: 'u', kind: 'homeUpgrade', ref: 'kitchenLevel', level: 3, pa: 4 }, true, DAY).subscribe();

        expect(update_home).toHaveBeenCalledWith(3, { kitchenLevel: 3 });
        expect(homeLevelOf(target, 'kitchenLevel')).toBe(3);
        expect(homeLevelOf(target, 'laboLevel')).toBe(4);
    });

    it('amélioration : relit le citoyen avant d\'écrire, sans jamais baisser un niveau plus récent', (): void => {
        const target: Citizen = citizen({ kitchenLevel: 1 });
        fresh = citizen({ kitchenLevel: 3 });
        service.setDone(target, { id: 'u', kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 3 }, true, DAY).subscribe();

        expect(update_home).not.toHaveBeenCalled();
        expect(homeLevelOf(target, 'kitchenLevel')).toBe(3);
    });

    it('action inconnue du site : rien n\'est écrit', (): void => {
        let failed: boolean = false;
        service.setDone(citizen(), { id: 'x', kind: 'action', ref: '../../DataImport/all', pa: 0 }, true, DAY).subscribe({ error: (): void => {
            failed = true;
        } });

        expect(failed).toBe(true);
        expect(add_daily).not.toHaveBeenCalled();
    });

    it('amélioration : décocher redescend juste sous le niveau visé ; amélioration à un niveau = booléen', (): void => {
        const target: Citizen = citizen({ kitchenLevel: 3 });
        fresh = citizen({ kitchenLevel: 3 });
        service.setDone(target, { id: 'u', kind: 'homeUpgrade', ref: 'kitchenLevel', level: 3, pa: 4 }, false, DAY).subscribe();
        expect(update_home).toHaveBeenLastCalledWith(3, { kitchenLevel: 2 });

        fresh = citizen({ hasLock: false });
        service.setDone(target, { id: 'l', kind: 'homeUpgrade', ref: 'hasLock', level: 1, pa: 6 }, true, DAY).subscribe();
        expect(update_home).toHaveBeenLastCalledWith(3, { hasLock: true });
        expect(homeLevelOf(target, 'hasLock')).toBe(1);
    });

    it('ville sans API externe : une consigne Maison écrit le niveau de maison (saisi à la main dans ces villes)', (): void => {
        setTown(Object.assign(new TownDetails(), { has_external_api: false }));
        const target: Citizen = citizen({ houseLevel: 2 });
        fresh = citizen({ houseLevel: 2 });

        service.setDone(target, { id: 'h', kind: 'home', level: 4, pa: 4 }, true, DAY).subscribe();

        expect(update_home).toHaveBeenCalledWith(3, { houseLevel: 4 });
        expect(add_daily).not.toHaveBeenCalled();
        setTown(null);
    });

    it('consigne libre ou niveau de maison : coche propre à la consigne', (): void => {
        const target: Citizen = citizen();
        service.setDone(target, { id: 'f', kind: 'free', label: 'x', pa: 0 }, true, DAY).subscribe();
        service.setDone(target, { id: 'h', kind: 'home', level: 4, pa: 4 }, true, DAY).subscribe();

        expect(add_daily).toHaveBeenCalledWith(target, 'task_f', DAY);
        expect(add_daily).toHaveBeenCalledWith(target, 'task_h', DAY);
        expect(update_home).not.toHaveBeenCalled();
    });
});
