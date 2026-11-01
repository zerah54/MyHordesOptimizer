import { ANIMATION_MODULE_TYPE, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { ExpeditionOrderComponent } from '../../expeditions/expedition-order/expedition-order.component';
import { ExpeditionOrderEditorService } from '../../expeditions/expedition-orders/expedition-order-editor.service';
import { ExpeditionRoadbookComponent } from '../../expeditions/expedition-roadbook/expedition-roadbook.component';
import { myExpeditionsOf } from '../my-expeditions.util';
import { ProgramExpeditionComponent } from './program-expedition.component';

const ALICE: Citizen = Object.assign(new Citizen(), { id: 42, name: 'Alice' });
const BOB: Citizen = Object.assign(new Citizen(), { id: 43, name: 'Bob' });

function general(id: number, text: string): ExpeditionOrder {
    return new ExpeditionOrder({ id, type: 'text', text, isDone: false, position: id });
}

function item(id: number, is_broken: boolean): Item {
    return Object.assign(new Item(), { id, img: `item_${id}.gif`, img_broken: `item_${id}_broken.gif`, label: { de: `Objekt ${id}` }, is_broken });
}

function place(id: number, citizen_id: number | undefined, extra: Partial<CitizenExpedition> = {}): CitizenExpedition {
    return Object.assign(new CitizenExpedition(), { id, citizen_id, orders: [], ...extra });
}

function part(id: number, position: number, citizens: CitizenExpedition[]): ExpeditionPart {
    return Object.assign(new ExpeditionPart(), { id, position, orders: [], citizens });
}

function expedition(parts: ExpeditionPart[], state: 'ready' | 'stop' = 'ready'): Expedition {
    return Object.assign(new Expedition(), { id: 1, label: 'Nord', state, parts });
}

describe('ProgramExpeditionComponent', (): void => {
    let fixture: ComponentFixture<ProgramExpeditionComponent>;
    let editor: { toggleDone: ReturnType<typeof vi.fn> };

    beforeEach((): void => {
        editor = { toggleDone: vi.fn().mockResolvedValue(undefined) };
        TestBed.configureTestingModule({
            imports: [ProgramExpeditionComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: ExpeditionOrderEditorService, useValue: editor }
            ]
        });
    });

    function render(value: Expedition): void {
        fixture = TestBed.createComponent(ProgramExpeditionComponent);
        fixture.componentRef.setInput('expedition', myExpeditionsOf([value], ALICE.id)[0]);
        fixture.componentRef.setInput('citizens', [ALICE, BOB]);
        fixture.componentRef.setInput('expeditions', [value]);
        fixture.componentRef.setInput('me', ALICE.id);
        fixture.componentRef.setInput('day', 1);
        fixture.detectChanges();
    }

    function text(): string {
        return (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');
    }

    function roadbooks(): ExpeditionRoadbookComponent[] {
        return fixture.debugElement.queryAll(By.directive(ExpeditionRoadbookComponent)).map((debug: DebugElement): ExpeditionRoadbookComponent => debug.componentInstance);
    }

    async function showTeam(): Promise<void> {
        const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-button-toggle button'));
        buttons[1].click();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    it('affiche la vue Moi par défaut, Feuille de route filtrée sur moi', (): void => {
        render(expedition([part(1, 0, [place(10, ALICE.id), place(11, BOB.id)])]));

        expect(roadbooks().length).toBe(1);
        expect(roadbooks()[0].onlyUser()).toBe(ALICE.id);
        expect(text()).toContain('Bob');
    });

    it('montre le prévu de départ une seule fois pour plusieurs parties', (): void => {
        render(expedition([
            part(1, 0, [place(10, ALICE.id, { base_ap: 9 })]),
            part(2, 1, [place(20, ALICE.id)])
        ]));

        expect(roadbooks().length).toBe(2);
        expect(fixture.nativeElement.querySelectorAll('.departure').length).toBe(1);
        expect(fixture.nativeElement.querySelector('.departure .ap').textContent).toContain('9');
    });

    it('vue équipe : consigne générale d\'un membre en partie 2 visible sur sa ligne', async (): Promise<void> => {
        render(expedition([
            part(1, 0, [place(10, ALICE.id), place(11, BOB.id)]),
            part(2, 1, [place(20, ALICE.id), place(21, BOB.id, { orders: [general(7, 'Ramener du bois')] })])
        ]));

        await showTeam();

        const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.member'));
        expect(rows[1].textContent).toContain('Ramener du bois');
        expect(rows[0].textContent).not.toContain('Ramener du bois');
    });

    it('vue équipe : consigne générale de partie visible et cochable', async (): Promise<void> => {
        const order: ExpeditionOrder = general(8, 'Tous ensemble');
        const first: ExpeditionPart = part(1, 0, [place(10, ALICE.id)]);
        first.orders = [order];
        render(expedition([first]));
        await showTeam();

        expect(text()).toContain('Tous ensemble');
        fixture.debugElement.query(By.directive(ExpeditionOrderComponent)).componentInstance.doneChange.emit(true);
        expect(editor.toggleDone).toHaveBeenCalledWith(order, true);
    });

    it('passe en vue équipe : une ligne par place, place vide = Place libre', async (): Promise<void> => {
        render(expedition([part(1, 0, [place(10, ALICE.id), place(11, BOB.id), place(12, undefined)])]));

        await showTeam();

        expect(roadbooks()[0].onlyUser()).toBeNull();
        expect(fixture.nativeElement.querySelectorAll('.member').length).toBe(3);
        expect(text()).toContain('Place libre');
    });

    it('vue équipe : place occupée par un citoyen introuvable, nom de repli sans fiche', async (): Promise<void> => {
        render(expedition([part(1, 0, [place(10, ALICE.id), place(11, 99)])]));

        await showTeam();

        const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.member'));
        expect(rows[1].textContent).not.toContain('Place libre');
        expect(rows[1].textContent).toContain('Place 2');
        expect(rows[1].querySelector('mho-citizen-chip')).toBeNull();
    });

    it('vue Moi : coéquipier introuvable affiché par son nom de repli', (): void => {
        render(expedition([part(1, 0, [place(10, ALICE.id), place(11, 99)])]));

        expect(fixture.nativeElement.querySelector('.mates').textContent).toContain('Place 2');
        expect(fixture.nativeElement.querySelectorAll('.mates mho-citizen-chip').length).toBe(0);
    });

    it('affiche la compétence préinscrite par son libellé', (): void => {
        render(expedition([part(1, 0, [place(10, ALICE.id, { preinscrit_heroic_skill: 'hero_generic_rescue' })])]));

        expect(fixture.nativeElement.querySelector('.departure .skill').textContent).toContain('Sauvetage');
        expect(text()).not.toContain('hero_generic_rescue');
    });

    it('vue équipe : consigne sur case d\'un membre visible sur sa ligne, avec ses coordonnées', async (): Promise<void> => {
        const on_cell: ExpeditionOrder = Object.assign(general(9, 'Fouiller ici'), { x: 9, y: 7 });
        render(expedition([part(1, 0, [place(10, ALICE.id), place(11, BOB.id, { orders: [on_cell] })])]));
        fixture.componentRef.setInput('map', Object.assign(new Town(), { town_x: 7, town_y: 7, map_width: 15, map_height: 15, cells: [] }));
        fixture.detectChanges();

        await showTeam();

        const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.member'));
        expect(rows[1].textContent).toContain('Fouiller ici');
        expect(rows[1].querySelector('mho-expedition-order .cell')?.textContent).toContain('[2 ; 0]');
    });

    it('vue équipe : consignes d\'une place rangées dans l\'ordre du tracé, passage compris', async (): Promise<void> => {
        const on_cell: (id: number, text: string, x: number, passage: number | null) => ExpeditionOrder = (id: number, text: string, x: number, passage: number | null): ExpeditionOrder =>
            Object.assign(general(id, text), { x, y: 7, passage });
        const first: ExpeditionPart = part(1, 0, [place(10, ALICE.id, {
            orders: [on_cell(1, 'Retour', 8, 2), on_cell(2, 'Aller', 8, 1), on_cell(3, 'Plus loin', 10, null)]
        })]);
        first.map_route = { id: 1, label: 'T', color: 'blue', cells: [{ x: 8, y: 7 }, { x: 9, y: 7 }, { x: 8, y: 7 }, { x: 10, y: 7 }], length: 3, version: 1 } as ExpeditionPart['map_route'];
        render(expedition([first]));
        await showTeam();

        const row: string = fixture.nativeElement.querySelector('.member').textContent;
        expect(row.indexOf('Aller')).toBeGreaterThanOrEqual(0);
        expect(row.indexOf('Aller')).toBeLessThan(row.indexOf('Retour'));
        expect(row.indexOf('Retour')).toBeLessThan(row.indexOf('Plus loin'));
    });

    it('sac prévu regroupé par objet et état cassé, libellé avec repli de langue', (): void => {
        const bagged: CitizenExpedition = place(10, ALICE.id);
        bagged.bag.items = [item(1, false), item(1, true), item(1, false)];
        render(expedition([part(1, 0, [bagged])]));

        const lines: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.departure .bag-item'));
        expect(lines.length).toBe(2);
        expect(lines[0].textContent).toContain('×2');
        expect(lines[1].textContent).toContain('×1');
        expect(lines[1].classList.contains('broken')).toBe(true);
        expect(lines[1].querySelector('img')?.getAttribute('src')).toContain('item_1_broken.gif');
        expect(lines[0].querySelector('img')?.getAttribute('alt')).toBe('Objekt 1');
    });

    it('signale une expédition en préparation', (): void => {
        render(expedition([part(1, 0, [place(10, ALICE.id)])], 'stop'));

        expect(text()).toContain('En préparation');
    });

    it('coche une consigne générale via le service', (): void => {
        const order: ExpeditionOrder = general(5, 'Rentrer avant 20h');
        render(expedition([part(1, 0, [place(10, ALICE.id, { orders: [order] })])]));
        fixture.componentRef.setInput('checkable', true);
        fixture.detectChanges();

        fixture.debugElement.query(By.directive(ExpeditionOrderComponent)).componentInstance.doneChange.emit(true);

        expect(editor.toggleDone).toHaveBeenCalledWith(order, true);
    });

    it('n\'affiche ni soif ni chaussures si indifférent', (): void => {
        render(expedition([part(1, 0, [place(10, ALICE.id)])]));

        expect(text()).not.toContain('Soif');
        expect(text()).not.toContain('Chaussures');
    });
});
