import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyActionEnum } from '../../../../_abstract_model/enum/daily-action.enum';
import { HomeUpgradeRef } from '../home-upgrades.util';
import { PlanningTaskFieldsComponent } from './planning-task-fields.component';

const UPGRADES: HomeUpgradeRef[] = [
    { key: 'kitchenLevel', label: 'Cuisine', max_level: 4, levels: [{ level: 1, ap: 6 }, { level: 2, ap: 3 }] },
    { key: 'hasLock', label: 'Verrou', max_level: 1, levels: [{ level: 1, ap: 6 }] }
];

describe('PlanningTaskFieldsComponent', (): void => {
    let fixture: ComponentFixture<PlanningTaskFieldsComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [PlanningTaskFieldsComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningTaskFieldsComponent);
        fixture.componentRef.setInput('kind', 'free');
        fixture.componentRef.setInput('upgrades', UPGRADES);
        fixture.detectChanges();
    });

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    /**
     * Ouvre une liste et en lit les choix.
     * @param {string} field Champ.
     * @returns {string[]} Libellés, espaces normalisées.
     */
    function options(field: string): string[] {
        fixture.detectChanges();
        root().querySelector<HTMLElement>(`mat-select[data-field="${field}"] .mat-mdc-select-trigger`)?.click();
        fixture.detectChanges();
        return Array.from(document.querySelectorAll<HTMLElement>('mat-option')).map((option: HTMLElement): string => (option.textContent ?? '').replace(/\s+/g, ' ').trim());
    }

    it('« Travaux personnels » grisé quand il n\'est pas permis, « Action » grisé sans action', (): void => {
        fixture.componentRef.setInput('upgradeAllowed', false);
        fixture.componentRef.setInput('actionOptions', []);
        options('task-kind');

        const disabled: string[] = Array.from(document.querySelectorAll<HTMLElement>('mat-option[aria-disabled="true"]'))
            .map((option: HTMLElement): string => (option.textContent ?? '').trim());
        expect(disabled).toEqual(['Travaux personnels', 'Action']);
    });

    it('niveaux d\'amélioration avec leurs PA, et le choix par défaut quand il est fourni', (): void => {
        fixture.componentRef.setInput('kind', 'homeUpgrade');
        fixture.componentRef.setInput('upgradeRef', 'kitchenLevel');
        fixture.componentRef.setInput('levelDefaultLabel', 'Niveau suivant de chacun');

        expect(options('task-upgrade-level')).toEqual(['Niveau suivant de chacun', 'niv. 1 (6)', 'niv. 2 (3)']);
    });

    it('amélioration à un seul niveau : pas de choix du niveau', (): void => {
        fixture.componentRef.setInput('kind', 'homeUpgrade');
        fixture.componentRef.setInput('upgradeRef', 'hasLock');
        fixture.detectChanges();

        expect(root().querySelector('[data-field="task-upgrade-level"]')).toBeNull();
    });

    it('niveaux de maison avec leurs PA', (): void => {
        fixture.componentRef.setInput('kind', 'home');
        fixture.componentRef.setInput('homeLevels', [{ level: 2, label: 'Baracke', ap: 4 }]);

        expect(options('task-home-level')).toEqual(['Baracke (4)']);
    });

    it('utilisations proposées seulement s\'il y a un choix', (): void => {
        fixture.componentRef.setInput('kind', 'action');
        fixture.componentRef.setInput('actionOptions', [DailyActionEnum.HOME_SCAVENGE]);
        fixture.componentRef.setInput('actionRef', 'home_scavenge');
        fixture.componentRef.setInput('useOptions', [1]);
        fixture.detectChanges();
        expect(root().querySelector('[data-field="task-count"]')).toBeNull();

        fixture.componentRef.setInput('useOptions', [1, 2, 3]);
        expect(options('task-count')).toEqual(['×1', '×2', '×3']);
    });

    it('PA et libellé saisis : remontés tels quels', (): void => {
        const pa: unknown[] = [];
        const labels: string[] = [];
        fixture.componentInstance.paChange.subscribe((value: unknown): number => pa.push(value));
        fixture.componentInstance.labelChange.subscribe((value: string): number => labels.push(value));
        const pa_input: HTMLInputElement = root().querySelector<HTMLInputElement>('input[data-field="task-pa"]') as HTMLInputElement;
        const label_input: HTMLInputElement = root().querySelector<HTMLInputElement>('input[data-field="task-label"]') as HTMLInputElement;

        pa_input.value = '5';
        pa_input.dispatchEvent(new Event('input'));
        label_input.value = 'Puits';
        label_input.dispatchEvent(new Event('input'));

        expect(pa).toEqual(['5']);
        expect(labels).toEqual(['Puits']);
    });
});
