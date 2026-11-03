import { ComponentFixture, TestBed } from '@angular/core/testing';
import moment from 'moment';
import { Observable, of, throwError } from 'rxjs';

import { ApiService } from '../../../_abstract_model/services/api.service';
import { BuildingPlanService } from '../../../_abstract_model/services/building-plan.service';
import { Building } from '../../../_abstract_model/types/building.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { setTown } from '../../../_core/utilities/localstorage.util';
import { BuildingUpgradesDTO } from '../../../my-town/buildings/planning/building-upgrades.types';
import { BuildingPlanStateDTO, TownBuildingStateDTO } from '../../../my-town/buildings/planning/plan.types';
import { BuildingUpgradesComponent } from './building-upgrades.component';

const WALL_ID: number = 1;
const SCOPE_ID: number = 2;
const NO_UPGRADE_ID: number = 3;
const DISABLED_ID: number = 4;

/**
 * Chantier minimal du catalogue.
 * @param {number} id Identifiant.
 * @param {string} uid Uid.
 * @param {string} name Nom.
 * @returns {Building} Chantier.
 */
function building(id: number, uid: string, name: string): Building {
    const result: Building = new Building();
    result.id = id;
    result.uid = uid;
    result.img = `${uid}.gif`;
    result.label = { [moment.locale()]: name };
    result.parent_id = null;
    result.display_order = id;
    return result;
}

/**
 * Évolution minimale : le texte de chaque niveau porte son numéro.
 * @param {string} name Nom du chantier.
 * @param {number} max_level Niveau maximum.
 * @returns {BuildingUpgradesDTO[string]} Évolution.
 */
function upgrade(name: string, max_level: number): BuildingUpgradesDTO[string] {
    const locale: string = moment.locale();
    return {
        maxLevel: max_level,
        texts: {
            base: { [locale]: `${name} base` },
            levels: Array.from({ length: max_level }, (_: unknown, index: number): Record<string, string> => ({ [locale]: `${name} niveau ${index + 1}` }))
        }
    };
}

/**
 * État synchronisé d'un chantier.
 * @param {number} id Identifiant du chantier.
 * @param {boolean} is_built Chantier construit.
 * @param {number | null} level Niveau.
 * @returns {TownBuildingStateDTO} État.
 */
function state(id: number, is_built: boolean, level: number | null): TownBuildingStateDTO {
    return { buildingId: id, isBuilt: is_built, paCurrent: null, apRemaining: null, life: null, maxLife: null, def: null, level, difficulty: null, resources: [] };
}

describe('BuildingUpgradesComponent', (): void => {
    let fixture: ComponentFixture<BuildingUpgradesComponent>;
    let get_state: Observable<BuildingPlanStateDTO>;
    let state_calls: number;

    /**
     * Crée le composant et attend son rendu.
     * @param {boolean} town_only Filtre « Dans ma ville ».
     */
    function render(town_only: boolean = false): void {
        fixture = TestBed.createComponent(BuildingUpgradesComponent);
        fixture.componentRef.setInput('townOnly', town_only);
        fixture.detectChanges();
    }

    /**
     * Texte d'une ligne du tableau, retrouvée par le nom de son chantier.
     * @param {string} name Nom du chantier.
     * @returns {string} Texte de la ligne.
     */
    function rowText(name: string): string {
        return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tr.mat-mdc-row'))
            .map((row: Element): string => row.textContent ?? '')
            .find((text: string): boolean => text.includes(name)) ?? '';
    }

    /**
     * Noms des chantiers affichés.
     * @returns {string[]} Noms.
     */
    function names(): string[] {
        return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tr.mat-mdc-row .name'))
            .map((name: Element): string => (name.textContent ?? '').trim());
    }

    beforeEach(async (): Promise<void> => {
        const disabled: Building = building(DISABLED_ID, 'disabled_#00', 'Indisponible');
        disabled.availability = { PANDE: 'Disabled', RNE: 'Disabled' };
        get_state = of({ buildings: [state(WALL_ID, true, 2), state(SCOPE_ID, false, null)] } as unknown as BuildingPlanStateDTO);
        state_calls = 0;

        await TestBed.configureTestingModule({
            imports: [BuildingUpgradesComponent],
            providers: [
                {
                    provide: ApiService,
                    useValue: {
                        getBuildings: (): Observable<Building[]> => of([
                            building(WALL_ID, 'wall_#00', 'Muraille'),
                            building(SCOPE_ID, 'scope_#00', 'Plateforme'),
                            building(NO_UPGRADE_ID, 'none_#00', 'Sans évolution'),
                            disabled
                        ])
                    }
                },
                {
                    provide: BuildingPlanService,
                    useValue: {
                        getBuildingUpgrades: (): Observable<BuildingUpgradesDTO> => of({
                            'wall_#00': upgrade('Muraille', 5),
                            'scope_#00': upgrade('Plateforme', 4),
                            'disabled_#00': upgrade('Indisponible', 1)
                        }),
                        getState: (): Observable<BuildingPlanStateDTO> => {
                            state_calls++;
                            return get_state;
                        }
                    }
                }
            ]
        }).compileComponents();
    });

    afterEach((): void => setTown(null));

    it('lists every building with upgrades, and no other', (): void => {
        render();

        expect(names()).toEqual(['Muraille', 'Plateforme', 'Indisponible']);
    });

    it('omits a building that cannot exist in the type of the town', (): void => {
        const town: TownDetails = new TownDetails();
        town.town_type = 'RNE';
        setTown(town);
        render();

        expect(names()).toEqual(['Muraille', 'Plateforme']);
    });

    it('omits a building that cannot exist in a Pandemonium town', (): void => {
        const town: TownDetails = new TownDetails();
        town.town_type = 'PANDE';
        setTown(town);
        render();

        expect(names()).toEqual(['Muraille', 'Plateforme']);
    });

    it('offers one button per level, from 0 to the maximum', (): void => {
        render();

        const buttons: Element[] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tr.mat-mdc-row:first-child mat-button-toggle'));

        expect(buttons.map((button: Element): string => (button.textContent ?? '').trim())).toEqual(['0', '1', '2', '3', '4', '5']);
    });

    it('shows the base text at level 0 without a town', (): void => {
        render();

        expect(rowText('Muraille')).toContain('Muraille base');
    });

    it('does not read the town state without a town', (): void => {
        render();

        expect(state_calls).toBe(0);
    });

    it('opens a built building of the town on its current level', (): void => {
        setTown(new TownDetails());
        render();

        expect(rowText('Muraille')).toContain('Muraille niveau 2');
    });

    it('opens a building not built in the town on level 0', (): void => {
        setTown(new TownDetails());
        render();

        expect(rowText('Plateforme')).toContain('Plateforme base');
    });

    it('marks only the current level of a built building', (): void => {
        setTown(new TownDetails());
        render();

        const current: Element[] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('mat-button-toggle.is-current'));

        expect(current.map((button: Element): string => (button.textContent ?? '').trim())).toEqual(['2']);
    });

    it('keeps only the built buildings with the town filter', (): void => {
        setTown(new TownDetails());
        render(true);

        expect(names()).toEqual(['Muraille']);
    });

    it('shows the text of the consulted level and recalls the current one', (): void => {
        setTown(new TownDetails());
        render();

        const buttons: NodeListOf<HTMLButtonElement> = (fixture.nativeElement as HTMLElement).querySelectorAll('tr.mat-mdc-row:first-child mat-button-toggle button');
        buttons[4].click();
        fixture.detectChanges();

        expect(rowText('Muraille')).toContain('Muraille niveau 4');
        expect((fixture.nativeElement as HTMLElement).querySelector('tr.mat-mdc-row:first-child .current-hint')?.textContent).toContain('2');
    });

    it('does not recall the current level when it is the one displayed', (): void => {
        setTown(new TownDetails());
        render();

        expect((fixture.nativeElement as HTMLElement).querySelector('.current-hint')).toBeNull();
    });

    it('keeps the full list when the town state cannot be read', (): void => {
        setTown(new TownDetails());
        get_state = throwError((): Error => new Error('unavailable'));
        render();

        expect(names()).toEqual(['Muraille', 'Plateforme', 'Indisponible']);
    });
});
