import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderWithSelectFilterComponent } from './header-with-select-filter.component';

describe('HeaderWithSelectFilterComponent', () => {
    let fixture: ComponentFixture<HeaderWithSelectFilterComponent<{
        label: string;
    }>>;
    let component: HeaderWithSelectFilterComponent<{
        label: string;
    }>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HeaderWithSelectFilterComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }]
        }).compileComponents();

        fixture = TestBed.createComponent<HeaderWithSelectFilterComponent<{
            label: string;
        }>>(HeaderWithSelectFilterComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('header', 'Objet');
        fixture.componentRef.setInput('options', [{ label: 'A' }, { label: 'B' }]);
        fixture.componentRef.setInput('filterValue', []);
        // Pas de detectChanges() ici : checkVisibility() lit `this.filter().select()?.panelOpen` —
        // pour le tester sans dépendre du cycle d'ouverture/fermeture réel du panneau MatSelect
        // (CDK Overlay, hors périmètre de ce composant), certains tests positionnent `visible` AVANT
        // le tout premier rendu, où le select est monté sans que son panneau ait jamais été ouvert.
        vi.useFakeTimers();
    });

    afterEach((): void => {
        // Destruction explicite (comme select.component.spec.ts) : évite qu'un callback interne à
        // mho-select/MatSelect s'exécute après coup sur un composant en cours de démontage.
        fixture.destroy();
        vi.useRealTimers();
    });

    it('affiche l\'icône pour ouvrir le filtre, le select masqué', () => {
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('mho-select')).toBeNull();
    });

    it('affiche le select après clic sur l\'icône', async () => {
        fixture.detectChanges();

        const icon: HTMLElement = fixture.nativeElement.querySelector('.open-menu-icon');
        icon.click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('mho-select')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeNull();

        await vi.advanceTimersByTimeAsync(0); // vidange le setTimeout de displayFilter (ouverture du panneau du select)
    });

    it('checkVisibility (rappelé de façon asynchrone par mho-select) masque à nouveau le select si son panneau est fermé et filterValue est vide', async () => {
        const internal: {
            visible: {
                set(v: boolean): void;
            };
            checkVisibility(): void;
        } = component as unknown as {
            visible: {
                set(v: boolean): void;
            };
            checkVisibility(): void;
        };
        internal.visible.set(true);
        fixture.detectChanges();

        internal.checkVisibility();
        await vi.advanceTimersByTimeAsync(0); // vidange le setTimeout interne de checkVisibility
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('mho-select')).toBeNull();
    });

    it('checkVisibility garde le select affiché si filterValue contient des éléments', async () => {
        fixture.componentRef.setInput('filterValue', [{ label: 'A' }]);
        const internal: {
            visible: {
                set(v: boolean): void;
            };
            checkVisibility(): void;
        } = component as unknown as {
            visible: {
                set(v: boolean): void;
            };
            checkVisibility(): void;
        };
        internal.visible.set(true);
        fixture.detectChanges();

        internal.checkVisibility();
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('mho-select')).toBeTruthy();
    });
});
