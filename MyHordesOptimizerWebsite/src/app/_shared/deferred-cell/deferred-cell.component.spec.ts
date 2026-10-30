import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeferredCellComponent } from './deferred-cell.component';

/** Hôte minimal : contenu projeté dans une cellule différée. */
@Component({
    imports: [DeferredCellComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<mho-deferred-cell [eager]="eager()"><span class="content">Contenu</span></mho-deferred-cell>`
})
class DeferredCellHostComponent {
    public eager: WritableSignal<boolean> = signal(false);
}

describe('DeferredCellComponent', (): void => {
    let fixture: ComponentFixture<DeferredCellHostComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({ imports: [DeferredCellHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(DeferredCellHostComponent);
    });

    /** Laisse le bloc différé passer à son état final, puis rafraîchit la vue. */
    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    it('garde le placeholder tant que la cellule n\'est pas à l\'écran', async (): Promise<void> => {
        await settle();

        expect(fixture.nativeElement.querySelector('.defered-cell')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.content')).toBeNull();
    });

    it('affiche le contenu sans attendre l\'écran quand eager est actif', async (): Promise<void> => {
        await settle();

        fixture.componentInstance.eager.set(true);
        await settle();

        expect(fixture.nativeElement.querySelector('.content')?.textContent).toBe('Contenu');
        expect(fixture.nativeElement.querySelector('.defered-cell')).toBeNull();
    });
});
