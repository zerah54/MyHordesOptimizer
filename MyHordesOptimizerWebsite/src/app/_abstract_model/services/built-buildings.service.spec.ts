import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import { setTown } from '../../_core/utilities/localstorage.util';
import { BuildingPlanStateDTO, TownBuildingStateDTO } from '../../my-town/buildings/planning/plan.types';
import { TownDetailsDTO } from '../dto/town-details.dto';
import { Building } from '../types/building.class';
import { TownDetails } from '../types/town-details.class';
import { ApiService } from './api.service';
import { BuildingPlanService } from './building-plan.service';
import { BuiltBuildingsService } from './built-buildings.service';

/**
 * État synchronisé d'un chantier.
 * @param {number} id Identifiant.
 * @param {boolean} built Construit.
 * @returns {TownBuildingStateDTO} État.
 */
function state(id: number, built: boolean, level: number | null = null): TownBuildingStateDTO {
    return { buildingId: id, isBuilt: built, paCurrent: null, apRemaining: null, life: null, maxLife: null, def: null, level, difficulty: null, resources: [] };
}

describe('BuiltBuildingsService', (): void => {
    let get_state: ReturnType<typeof vi.fn>;
    let get_buildings: ReturnType<typeof vi.fn>;

    /**
     * Instancie le service avec un état et un référentiel donnés.
     * @param {Observable<BuildingPlanStateDTO>} state$ État renvoyé.
     * @returns {BuiltBuildingsService} Service.
     */
    function create(state$: Observable<BuildingPlanStateDTO>): BuiltBuildingsService {
        get_state = vi.fn((): Observable<BuildingPlanStateDTO> => state$);
        get_buildings = vi.fn((): Observable<Building[]> => of([
            Object.assign(new Building(), { id: 1, uid: 'small_gallery_#00' }),
            Object.assign(new Building(), { id: 2, uid: 'small_pool_#00' })
        ]));
        TestBed.configureTestingModule({
            providers: [
                { provide: BuildingPlanService, useValue: { getState: get_state } },
                { provide: ApiService, useValue: { getBuildings: get_buildings } }
            ]
        });
        return TestBed.inject(BuiltBuildingsService);
    }

    beforeEach((): void => {
        setTown(new TownDetails({ townId: 42 } as TownDetailsDTO));
    });

    afterEach((): void => {
        setTown(null);
    });

    it('renvoie les uids des chantiers construits', (): void => {
        const service: BuiltBuildingsService = create(of({ buildings: [state(1, true), state(2, false)], defense: null }));
        let result: ReadonlySet<string> | null | undefined;
        service.builtUids().subscribe((uids: ReadonlySet<string> | null): void => {
            result = uids;
        });

        expect(result).toEqual(new Set<string>(['small_gallery_#00']));
        expect(get_state).toHaveBeenCalledWith(true);
    });

    it('repli nul si l\'état est indisponible', (): void => {
        const service: BuiltBuildingsService = create(throwError((): Error => new Error('404')));
        let result: ReadonlySet<string> | null | undefined;
        service.builtUids().subscribe((uids: ReadonlySet<string> | null): void => {
            result = uids;
        });

        expect(result).toBeNull();
    });

    it('repli nul si aucun chantier n\'est synchronisé (ville jamais mise à jour, lecteur sans droit)', (): void => {
        const service: BuiltBuildingsService = create(of({ buildings: [], defense: null }));
        let result: ReadonlySet<string> | null | undefined;
        service.builtUids().subscribe((uids: ReadonlySet<string> | null): void => {
            result = uids;
        });

        expect(result).toBeNull();
    });

    it('renvoie le niveau d\'évolution des chantiers construits (0 s\'il est inconnu)', (): void => {
        const service: BuiltBuildingsService = create(of({ buildings: [state(1, true, 2), state(2, false, 1)], defense: null }));
        let result: ReadonlyMap<string, number> | null | undefined;
        service.builtLevels().subscribe((levels: ReadonlyMap<string, number> | null): void => {
            result = levels;
        });
        expect(result).toEqual(new Map<string, number>([['small_gallery_#00', 2]]));
    });

    it('niveau 0 pour un chantier construit dont le niveau est inconnu', (): void => {
        const service: BuiltBuildingsService = create(of({ buildings: [state(1, true)], defense: null }));
        let result: ReadonlyMap<string, number> | null | undefined;
        service.builtLevels().subscribe((levels: ReadonlyMap<string, number> | null): void => {
            result = levels;
        });
        expect(result).toEqual(new Map<string, number>([['small_gallery_#00', 0]]));
    });

    it('repli nul des niveaux si l\'état est indisponible', (): void => {
        const service: BuiltBuildingsService = create(throwError((): Error => new Error('404')));
        let result: ReadonlyMap<string, number> | null | undefined;
        service.builtLevels().subscribe((levels: ReadonlyMap<string, number> | null): void => {
            result = levels;
        });

        expect(result).toBeNull();
    });

    it('un seul chargement pour plusieurs abonnements rapprochés', (): void => {
        const service: BuiltBuildingsService = create(of({ buildings: [state(1, true)], defense: null }));
        service.builtUids().subscribe();
        service.builtUids().subscribe();
        service.builtLevels().subscribe();

        expect(get_state).toHaveBeenCalledTimes(1);
        expect(get_buildings).toHaveBeenCalledTimes(1);
    });
});
