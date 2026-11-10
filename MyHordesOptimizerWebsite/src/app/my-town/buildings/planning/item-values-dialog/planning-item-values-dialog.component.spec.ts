import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { Item } from '../../../../_abstract_model/types/item.class';
import { emptyPlanContent } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FakePlanningStore } from '../planning.store.fake';
import { PlanningItemValuesDialogComponent } from './planning-item-values-dialog.component';

describe('PlanningItemValuesDialogComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningItemValuesDialogComponent>;

    async function render(): Promise<void> {
        fake = createFakeStore(emptyPlanContent());
        await TestBed.configureTestingModule({
            imports: [PlanningItemValuesDialogComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: PlanningStore, useValue: fake.store },
                { provide: MatDialogRef, useValue: { close: vi.fn() } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningItemValuesDialogComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function type(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
    }

    it('enregistre les valeurs d\'objets modifiées avec leur identifiant', async (): Promise<void> => {
        await render();

        type(root().querySelector<HTMLInputElement>('tr.value input[data-field="item-value"]') as HTMLInputElement, '3');
        root().querySelector<HTMLButtonElement>('button[data-action="save-values"]')?.click();

        expect(fake.actions['saveItemValues']).toHaveBeenCalledWith({ '5': 3 }, 1);
    });

    it('enregistre avec la version lue à la première modification, même si les valeurs ont été enregistrées ailleurs depuis', async (): Promise<void> => {
        await render();
        const input: HTMLInputElement = root().querySelector<HTMLInputElement>('tr.value input[data-field="item-value"]') as HTMLInputElement;

        type(input, '3');
        fake.settings_version.set(2);
        type(input, '4');
        root().querySelector<HTMLButtonElement>('button[data-action="save-values"]')?.click();

        expect(fake.actions['saveItemValues']).toHaveBeenCalledWith({ '5': 4 }, 1);
    });

    it('sans modification locale, enregistre sur la version courante', async (): Promise<void> => {
        await render();
        fake.settings_version.set(2);

        root().querySelector<HTMLButtonElement>('button[data-action="save-values"]')?.click();

        expect(fake.actions['saveItemValues']).toHaveBeenCalledWith({ '5': 2 }, null);
    });

    it('les suggestions proposent le nom des objets, pas leur uid', async (): Promise<void> => {
        await render();
        fake.items.set([Object.assign(new Item(), { id: 5, uid: 'wood', label: { fr: 'Bois', en: 'Bois', de: 'Bois', es: 'Bois' } })]);
        fixture.detectChanges();

        expect(root().querySelector<HTMLOptionElement>('datalist option')?.value).toBe('Bois');
    });

    it('ajoute une valeur pour un objet choisi par son nom', async (): Promise<void> => {
        await render();
        fake.item_values.set(new Map<number, number>());
        fixture.detectChanges();

        const name: HTMLInputElement = root().querySelector<HTMLInputElement>('input[data-field="add-value"]') as HTMLInputElement;
        name.value = 'wood';
        root().querySelector<HTMLButtonElement>('button[data-action="add-value"]')?.click();
        fixture.detectChanges();

        expect(root().querySelector('tr.value[data-item="5"]')).not.toBeNull();
    });

    it('lecture seule : saisie et enregistrement désactivés', async (): Promise<void> => {
        await render();
        fake.can_edit_settings.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(root().querySelector<HTMLButtonElement>('button[data-action="save-values"]')?.disabled).toBe(true);
        expect(root().querySelector<HTMLInputElement>('tr.value input[data-field="item-value"]')?.disabled).toBe(true);
    });
});
