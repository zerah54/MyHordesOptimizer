import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import moment from 'moment';
import { delay, of } from 'rxjs';

import { DigsService } from '../../../../_abstract_model/services/digs.service';
import { TownService } from '../../../../_abstract_model/services/town.service';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { ChamanicDetail } from '../../../../_abstract_model/types/chamanic-detail.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../../_abstract_model/types/dig.class';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { MapUpdateComponent, MapUpdateData } from './map-update.component';
import { MapUpdateCellComponent } from './map-update-cell/map-update-cell.component';
import { MapUpdateCitizensComponent } from './map-update-citizens/map-update-citizens.component';
import { MapUpdateDigsComponent } from './map-update-digs/map-update-digs.component';
import { MapUpdateRuinComponent } from './map-update-ruin/map-update-ruin.component';

/** Remplace mho-map-update-cell : capture les entrées et permet de simuler cellChange sans monter le vrai formulaire réactif. */
@Component({ selector: 'mho-map-update-cell', template: '', standalone: true })
class MapUpdateCellStubComponent {
    public readonly cell: InputSignal<Cell> = input.required();
    public readonly citizens: InputSignal<Citizen[]> = input.required();
    public readonly cellChange: OutputEmitterRef<Cell> = output();
}

/** Remplace mho-map-update-ruin. */
@Component({ selector: 'mho-map-update-ruin', template: '', standalone: true })
class MapUpdateRuinStubComponent {
    public readonly ruin: InputSignal<Ruin> = input.required();
    public readonly allRuins: InputSignal<Ruin[]> = input.required();
    public readonly cell: InputSignal<Cell> = input.required();
    public readonly cellChange: OutputEmitterRef<Cell> = output();
}

/** Remplace mho-map-update-citizens. */
@Component({ selector: 'mho-map-update-citizens', template: '', standalone: true })
class MapUpdateCitizensStubComponent {
    public readonly citizens: InputSignal<Citizen[]> = input.required();
    public readonly allCitizens: InputSignal<Citizen[]> = input.required();
    public readonly citizensChange: OutputEmitterRef<Citizen[]> = output();
}

/** Remplace mho-map-update-digs. */
@Component({ selector: 'mho-map-update-digs', template: '', standalone: true })
class MapUpdateDigsStubComponent {
    public readonly cell: InputSignal<Cell> = input.required();
    public readonly allCitizens: InputSignal<Citizen[]> = input.required();
    public readonly digs: InputSignal<Dig[]> = input.required();
    public readonly digsChange: OutputEmitterRef<Dig[]> = output();
}

function newCell(overrides: Partial<Cell> = {}): Cell {
    const cell: Cell = new Cell();
    Object.assign(cell, {
        cell_id: 1,
        x: 0,
        y: 0,
        displayed_x: 0,
        displayed_y: 0,
        is_town: false,
        citizens: [],
        items: [],
        note: '',
        scav_next_cells: null,
        scout_next_cells: null
    });
    Object.assign(cell, overrides);
    return cell;
}

function newCitizen(id: number, name: string): Citizen {
    const citizen: Citizen = new Citizen();
    citizen.id = id;
    citizen.name = name;
    citizen.chamanic_detail = new ChamanicDetail();
    return citizen;
}

function newDig(overrides: Partial<Dig> = {}): Dig {
    const dig: Dig = new Dig();
    Object.assign(dig, { digger_id: 1, digger_name: 'A', x: 0, y: 0, day: 1, nb_success: 0, nb_total_dig: 0 }, overrides);
    return dig;
}

describe('MapUpdateComponent', (): void => {
    let fixture: ComponentFixture<MapUpdateComponent>;
    let digsService: DigsService;
    let townService: TownService;

    beforeEach((): void => {
        TestBed.configureTestingModule({
            imports: [MapUpdateComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
        }).overrideComponent(MapUpdateComponent, {
            remove: { imports: [MapUpdateCellComponent, MapUpdateRuinComponent, MapUpdateCitizensComponent, MapUpdateDigsComponent] },
            add: { imports: [MapUpdateCellStubComponent, MapUpdateRuinStubComponent, MapUpdateCitizensStubComponent, MapUpdateDigsStubComponent] }
        });
    });

    /** Instancie le composant avec les data du dialogue ; getDigs() renvoie [] par défaut (surchargeable avant detectChanges()). */
    function create(data: MapUpdateData): void {
        TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
        digsService = TestBed.inject(DigsService);
        townService = TestBed.inject(TownService);
        spyOn(digsService, 'getDigs').and.returnValue(of([]));
        fixture = TestBed.createComponent(MapUpdateComponent);
    }

    function selectTabByLabel(label: string): void {
        const tabs: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.mat-mdc-tab'));
        const tab: HTMLElement = <HTMLElement>tabs.find((t: HTMLElement) => t.textContent?.includes(label));
        tab.dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();
        fixture.detectChanges();
    }

    it('shows "Ville" in the title for a town cell without a ruin', (): void => {
        create({ cell: newCell({ is_town: true }), all_citizens: [], all_ruins: [] });
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Ville');
    });

    it('shows "Désert" in the title for a non-town cell without a ruin', (): void => {
        create({ cell: newCell({ is_town: false }), all_citizens: [], all_ruins: [] });
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Désert');
    });

    it('shows the ruin label in the title when data.ruin is set', (): void => {
        const ruin: Ruin = new Ruin();
        ruin.label = { [moment.locale()]: 'Cave' };
        create({ cell: newCell(), ruin, all_citizens: [], all_ruins: [] });
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Cave');
    });

    it('shows the Cellule tab when the cell is not the town', (): void => {
        create({ cell: newCell({ is_town: false }), all_citizens: [], all_ruins: [] });
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Cellule');
    });

    it('hides the Cellule tab when the cell is the town', (): void => {
        create({ cell: newCell({ is_town: true }), all_citizens: [], all_ruins: [] });
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).not.toContain('Cellule');
    });

    it('shows the Bâtiment and Citoyens tabs only when data.ruin / cell.citizens apply', (): void => {
        const citizen: Citizen = newCitizen(1, 'Alice');
        const ruin: Ruin = new Ruin();
        ruin.label = { [moment.locale()]: 'Cave' };
        create({ cell: newCell({ citizens: [citizen] }), ruin, all_citizens: [citizen], all_ruins: [] });
        fixture.detectChanges();

        const labels: string = fixture.nativeElement.textContent;
        expect(labels).toContain('Bâtiment');
        expect(labels).toContain('Citoyens');
    });

    it('hides the Bâtiment and Citoyens tabs when there is no ruin and no citizen on the cell', (): void => {
        create({ cell: newCell({ citizens: [] }), all_citizens: [], all_ruins: [] });
        fixture.detectChanges();

        const labels: string = fixture.nativeElement.textContent;
        expect(labels).not.toContain('Bâtiment');
        expect(labels).not.toContain('Citoyens');
    });

    it('getDigs() is filtered to this cell\'s coordinates and fed to the Fouilles tab via digs()', (): void => {
        const cell: Cell = newCell({ displayed_x: 3, displayed_y: 4 });
        create({ cell, all_citizens: [], all_ruins: [] });
        (digsService.getDigs as jasmine.Spy).and.returnValue(of([
            newDig({ x: 3, y: 4, digger_id: 1 }),
            newDig({ x: 9, y: 9, digger_id: 2 })
        ]));
        fixture.detectChanges();

        selectTabByLabel('Fouilles');

        const digsStub: MapUpdateDigsStubComponent = fixture.debugElement.query((de) => de.componentInstance instanceof MapUpdateDigsStubComponent).componentInstance;
        expect(digsStub.digs().length).toBe(1);
        expect(digsStub.digs()[0].digger_id).toBe(1);
    });

    it('cellChange from the Cellule tab updates the shared cell (reflected by the header coordinates)', (): void => {
        const cell: Cell = newCell({ is_town: false, displayed_x: 0, displayed_y: 0 });
        create({ cell, all_citizens: [], all_ruins: [] });
        fixture.detectChanges();

        const cellStub: MapUpdateCellStubComponent = fixture.debugElement.query((de) => de.componentInstance instanceof MapUpdateCellStubComponent).componentInstance;
        const replacement: Cell = newCell({ displayed_x: 5, displayed_y: 6 });
        cellStub.cellChange.emit(replacement);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('small').textContent).toContain('[5 ; 6]');
    });

    it('citizensChange from the Citoyens tab updates cell.citizens', (): void => {
        const citizen: Citizen = newCitizen(1, 'Alice');
        const cell: Cell = newCell({ citizens: [citizen] });
        create({ cell, all_citizens: [citizen], all_ruins: [] });
        fixture.detectChanges();

        selectTabByLabel('Citoyens');

        const citizensStub: MapUpdateCitizensStubComponent = fixture.debugElement.query((de) => de.componentInstance instanceof MapUpdateCitizensStubComponent).componentInstance;
        const other: Citizen = newCitizen(2, 'Bob');
        citizensStub.citizensChange.emit([citizen, other]);
        fixture.detectChanges();

        // (citizensChange)="cell.citizens = $event" écrit sur `this.cell` (le clone local édité par le
        // dialogue), pas sur `data.cell` (`cell`, la variable locale du test) : ce sont deux objets distincts.
        const internalCell: Cell = (<{ cell: Cell }>(<unknown>fixture.componentInstance)).cell;
        expect(internalCell.citizens.length).toBe(2);
    });

    it('saveCell() calls TownService.saveCell() and DigsService.updateDig() when there are digs for this cell', (): void => {
        const cell: Cell = newCell({ displayed_x: 1, displayed_y: 2 });
        create({ cell, all_citizens: [], all_ruins: [] });
        (digsService.getDigs as jasmine.Spy).and.returnValue(of([newDig({ x: 1, y: 2, digger_id: 5 })]));
        spyOn(townService, 'saveCell').and.returnValue(of(newCell({ displayed_x: 1, displayed_y: 2, nb_zombie: 9 })));
        spyOn(digsService, 'updateDig').and.returnValue(of([]));
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button[mat-raised-button]').dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        expect(townService.saveCell).toHaveBeenCalledWith(jasmine.objectContaining({ displayed_x: 1, displayed_y: 2 }));
        expect(digsService.updateDig).toHaveBeenCalledWith([jasmine.objectContaining({ digger_id: 5 })]);
    });

    it('saveCell() does not call updateDig() when there are no digs for this cell', (): void => {
        const cell: Cell = newCell();
        create({ cell, all_citizens: [], all_ruins: [] });
        spyOn(townService, 'saveCell').and.returnValue(of(newCell()));
        spyOn(digsService, 'updateDig').and.returnValue(of([]));
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button[mat-raised-button]').dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        expect(digsService.updateDig).not.toHaveBeenCalled();
    });

    it('after a successful save, both mat-dialog-close bindings reflect the latest locally-edited cell rather than the stale pre-save data.cell (OnPush staleness guard)', fakeAsync((): void => {
        const original: Cell = newCell({ displayed_x: 1, displayed_y: 2, nb_zombie: 0 });
        create({ cell: original, all_citizens: [], all_ruins: [] });
        // saveCell() ignore la valeur renvoyée par l'observable (next: () => {...}, sans paramètre) : seul
        // le succès compte, data.cell est reconstruit depuis this.cell (l'édition locale), pas depuis la réponse HTTP.
        // delay(1) simule une vraie requête HTTP asynchrone, résolue hors de l'événement clic.
        //
        // NOTE MÉTHODOLOGIQUE (contre-épreuve effectuée par l'implémenteur, 2 essais, résultat négatif à
        // l'un comme à l'autre) : ce test — comme tout test Karma de ce composant — NE PEUT PAS distinguer
        // la version avec `dialog_close_cell` (signal) de la version reculée sur `data.cell` (champ nu).
        // `MapUpdateComponent` est ici la racine de la fixture ; `ChangeDetectorRef.detectChanges()` appelé
        // sur la racine réexécute TOUJOURS son propre template intégralement, indépendamment d'OnPush — seuls
        // les composants ENFANTS de la vue vérifiée sont soumis au filtrage OnPush pendant ce parcours. Ce
        // test reste utile pour caractériser le comportement (saveCell → data.cell reconstruit depuis
        // this.cell, pas depuis la réponse HTTP), mais ne constitue PAS une preuve du correctif `dialog_close_cell`
        // — cf. la ruling déjà actée au ledger (Task 6 : « un test unitaire ne peut pas trancher cette
        // question »). Justification du correctif : lecture du mécanisme interne (MatDialogClose.dialogResult
        // mis à jour uniquement par le binding, pas par une notification indépendante), pas ce test.
        spyOn(townService, 'saveCell').and.returnValue(of(newCell()).pipe(delay(1)));
        fixture.detectChanges();

        const cellStub: MapUpdateCellStubComponent = fixture.debugElement.query((de) => de.componentInstance instanceof MapUpdateCellStubComponent).componentInstance;
        cellStub.cellChange.emit(newCell({ displayed_x: 1, displayed_y: 2, nb_zombie: 7 }));
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button[mat-raised-button]').dispatchEvent(new MouseEvent('click'));
        fixture.detectChanges();

        tick(1); // la réponse HTTP arrive maintenant, hors de tout contexte d'événement du template
        fixture.detectChanges();

        const closeDirectives: MatDialogClose[] = fixture.debugElement.queryAll(By.directive(MatDialogClose))
            .map((de) => de.injector.get(MatDialogClose));
        expect(closeDirectives.length).toBe(2);
        closeDirectives.forEach((directive: MatDialogClose) => {
            expect(directive.dialogResult).not.toBe(original);
            expect((<Cell>directive.dialogResult).nb_zombie).toBe(7);
        });
    }));

    it('before any save, both mat-dialog-close bindings return the original data.cell', (): void => {
        const original: Cell = newCell({ displayed_x: 1, displayed_y: 2 });
        create({ cell: original, all_citizens: [], all_ruins: [] });
        fixture.detectChanges();

        const closeDirectives: MatDialogClose[] = fixture.debugElement.queryAll(By.directive(MatDialogClose))
            .map((de) => de.injector.get(MatDialogClose));
        closeDirectives.forEach((directive: MatDialogClose) => {
            expect(directive.dialogResult).toBe(original);
        });
    });
});
