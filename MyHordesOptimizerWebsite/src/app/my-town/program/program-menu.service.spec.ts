import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

import { environment } from '../../../environments/environment';
import { CitizenExpeditionDTO } from '../../_abstract_model/dto/citizen-expedition.dto';
import { DailyProgramFactsDTO } from '../../_abstract_model/dto/daily-program-facts.dto';
import { BuiltBuildingsService } from '../../_abstract_model/services/built-buildings.service';
import { DailyProgramService } from '../../_abstract_model/services/daily-program.service';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { setTown } from '../../_core/utilities/localstorage.util';
import { ProgramMenuService } from './program-menu.service';

describe('ProgramMenuService', (): void => {
    const events: Subject<unknown> = new Subject<unknown>();
    let get_facts: Mock<(map_id: number, day: number) => Observable<DailyProgramFactsDTO>>;
    let built_uids: Mock<() => Observable<ReadonlySet<string> | null>>;
    let service: ProgramMenuService;

    function town(town_id: number, day: number | undefined): TownDetails {
        return { town_id, day } as TownDetails;
    }

    function facts(overrides: Partial<DailyProgramFactsDTO> = {}): DailyProgramFactsDTO {
        return { isCitizen: true, hasEffectivePlan: true, isPlaced: false, openPlaces: [], me: null, ...overrides };
    }

    /** Instancie le service, laisse partir la demande initiale puis l'efface. */
    function createService(): ProgramMenuService {
        const created: ProgramMenuService = TestBed.inject(ProgramMenuService);
        TestBed.tick();
        get_facts.mockClear();
        return created;
    }

    beforeEach((): void => {
        get_facts = vi.fn((): Observable<DailyProgramFactsDTO> => of(facts()));
        built_uids = vi.fn((): Observable<ReadonlySet<string> | null> => of(null));
        TestBed.configureTestingModule({
            providers: [
                { provide: DailyProgramService, useValue: { getFacts: get_facts } },
                { provide: BuiltBuildingsService, useValue: { builtUids: built_uids } },
                { provide: Router, useValue: { events } }
            ]
        });
        setTown(town(10, 5));
    });

    afterEach((): void => {
        environment.production = false;
        setTown(null);
    });

    it('demande les faits de la ville et du jour à la construction', (): void => {
        TestBed.inject(ProgramMenuService);
        TestBed.tick();

        expect(get_facts).toHaveBeenCalledTimes(1);
        expect(get_facts).toHaveBeenCalledWith(10, 5);
    });

    it('devient visible quand les faits le disent', (): void => {
        service = createService();

        expect(service.visible()).toBe(true);
    });

    it('suit la ville posée après sa construction', (): void => {
        setTown(null);
        service = createService();
        expect(get_facts).not.toHaveBeenCalled();
        expect(service.visible()).toBe(false);

        setTown(town(10, 5));
        TestBed.tick();

        expect(get_facts).toHaveBeenCalledWith(10, 5);
        expect(service.visible()).toBe(true);
    });

    it('suit le changement de jour sans navigation', (): void => {
        service = createService();
        setTown(town(10, 6));
        TestBed.tick();

        expect(get_facts).toHaveBeenCalledTimes(1);
        expect(get_facts).toHaveBeenCalledWith(10, 6);
    });

    it('ne redemande rien si ni la ville ni le jour ne changent', (): void => {
        service = createService();
        setTown(town(10, 5));
        TestBed.tick();

        expect(get_facts).not.toHaveBeenCalled();
    });

    it('ville partielle sans jour : aucune requête, caché', (): void => {
        setTown(town(10, undefined));
        service = createService();
        events.next(new NavigationEnd(1, '/a', '/a'));

        expect(get_facts).not.toHaveBeenCalled();
        expect(service.visible()).toBe(false);
    });

    it('relit la ville à chaque fin de navigation', (): void => {
        service = createService();
        events.next(new NavigationEnd(1, '/a', '/a'));

        expect(get_facts).toHaveBeenCalledWith(10, 5);
    });

    it('reste caché sans ville', (): void => {
        service = createService();
        setTown(null);
        TestBed.tick();
        events.next(new NavigationEnd(1, '/a', '/a'));

        expect(get_facts).not.toHaveBeenCalled();
        expect(service.visible()).toBe(false);
    });

    it('reste caché en cas d\'erreur', (): void => {
        get_facts.mockReturnValue(throwError((): Error => new Error('boom')));
        service = createService();

        expect(service.visible()).toBe(false);
    });

    it('en production : aucune requête, caché', (): void => {
        environment.production = true;
        service = createService();
        events.next(new NavigationEnd(1, '/a', '/a'));

        expect(get_facts).not.toHaveBeenCalled();
        expect(service.visible()).toBe(false);
    });

    it('ne lit pas les chantiers construits quand un plan effectif suffit', (): void => {
        service = createService();

        expect(built_uids).not.toHaveBeenCalled();
    });

    it('lit les chantiers construits pour juger une place libre', (): void => {
        get_facts.mockReturnValue(of(facts({ hasEffectivePlan: false, openPlaces: [<CitizenExpeditionDTO>{ orders: [], preinscrit: false, pdc: 0 }] })));
        service = createService();

        expect(built_uids).toHaveBeenCalledTimes(1);
    });
});
