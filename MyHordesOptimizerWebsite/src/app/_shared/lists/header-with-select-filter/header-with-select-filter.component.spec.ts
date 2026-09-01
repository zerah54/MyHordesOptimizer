import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { HeaderWithSelectFilterComponent } from './header-with-select-filter.component';

describe('HeaderWithSelectFilterComponent', () => {
    let fixture: ComponentFixture<HeaderWithSelectFilterComponent<{ label: string }>>;
    let component: HeaderWithSelectFilterComponent<{ label: string }>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HeaderWithSelectFilterComponent],
            providers: [provideNoopAnimations()]
        }).compileComponents();

        fixture = TestBed.createComponent<HeaderWithSelectFilterComponent<{ label: string }>>(HeaderWithSelectFilterComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('header', 'Objet');
        fixture.componentRef.setInput('options', [{ label: 'A' }, { label: 'B' }]);
        fixture.componentRef.setInput('filterValue', []);
        // Pas de detectChanges() ici : checkVisibility() lit `this.filter().select()?.panelOpen` —
        // pour le tester sans dépendre du cycle d'ouverture/fermeture réel du panneau MatSelect
        // (CDK Overlay, hors périmètre de ce composant), certains tests positionnent `visible` AVANT
        // le tout premier rendu, où le select est monté sans que son panneau ait jamais été ouvert.
    });

    afterEach((): void => {
        // Destruction explicite (comme select.component.spec.ts) : évite qu'un callback interne à
        // mho-select/MatSelect s'exécute après coup sur un composant en cours de démontage.
        fixture.destroy();
    });

    it('affiche l\'icône pour ouvrir le filtre, le select masqué', () => {
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('mho-select')).toBeNull();
    });

    it('affiche le select après clic sur l\'icône', fakeAsync(() => {
        fixture.detectChanges();

        const icon: HTMLElement = fixture.nativeElement.querySelector('.open-menu-icon');
        icon.click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('mho-select')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.open-menu-icon')).toBeNull();

        tick(); // vidange le setTimeout de displayFilter (ouverture du panneau du select)
    }));

    it('checkVisibility (rappelé de façon asynchrone par mho-select) masque à nouveau le select si son panneau est fermé et filterValue est vide', fakeAsync(() => {
        const internal: { visible: { set(v: boolean): void }; checkVisibility(): void } = component as unknown as {
            visible: { set(v: boolean): void };
            checkVisibility(): void;
        };
        internal.visible.set(true);
        fixture.detectChanges();

        internal.checkVisibility();
        tick(); // vidange le setTimeout interne de checkVisibility
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('mho-select')).toBeNull();
    }));

    it('checkVisibility garde le select affiché si filterValue contient des éléments', fakeAsync(() => {
        fixture.componentRef.setInput('filterValue', [{ label: 'A' }]);
        const internal: { visible: { set(v: boolean): void }; checkVisibility(): void } = component as unknown as {
            visible: { set(v: boolean): void };
            checkVisibility(): void;
        };
        internal.visible.set(true);
        fixture.detectChanges();

        internal.checkVisibility();
        tick();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('mho-select')).toBeTruthy();
    }));
});
