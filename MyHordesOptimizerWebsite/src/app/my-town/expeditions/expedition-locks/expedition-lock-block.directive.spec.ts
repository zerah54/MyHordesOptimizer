import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpeditionLockKind } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { ExpeditionLockBlockDirective, ExpeditionLockTarget } from './expedition-lock-block.directive';
import { ExpeditionLocksStore } from './expedition-locks.store';
import { BlockLockState } from './expedition-locks.util';

@Component({
    template: `
        <div [mhoExpeditionLock]="target()" class="host">
            <input class="first" />
            <input class="second" />
        </div>
        <input class="outside" />
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ExpeditionLockBlockDirective],
})
class HostComponent {
    public readonly target: WritableSignal<ExpeditionLockTarget | null> = signal<ExpeditionLockTarget | null>({ kind: 'part', id: 7 });
}

describe('ExpeditionLockBlockDirective', (): void => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HTMLElement;
    let state: WritableSignal<BlockLockState>;
    let store: {
        stateOf: ReturnType<typeof vi.fn>;
        enter: ReturnType<typeof vi.fn>;
        activity: ReturnType<typeof vi.fn>;
        leave: ReturnType<typeof vi.fn>;
    };
    const created: HTMLElement[] = [];

    function q(selector: string): HTMLElement {
        return fixture.nativeElement.querySelector(selector);
    }

    function focusOut(from: HTMLElement, to: HTMLElement | null): void {
        from.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: to }));
    }

    beforeEach((): void => {
        state = signal<BlockLockState>({ kind: 'free' });
        store = {
            stateOf: vi.fn((): WritableSignal<BlockLockState> => state),
            enter: vi.fn((_kind: ExpeditionLockKind, _id: number): Promise<BlockLockState> => Promise.resolve({ kind: 'mine' })),
            activity: vi.fn(),
            leave: vi.fn(),
        };
        TestBed.configureTestingModule({ imports: [HostComponent], providers: [{ provide: ExpeditionLocksStore, useValue: store }] });
        fixture = TestBed.createComponent(HostComponent);
        document.body.appendChild(fixture.nativeElement);
        fixture.detectChanges();
        host = q('.host');
    });

    afterEach((): void => {
        created.splice(0).forEach((element: HTMLElement): void => element.remove());
        fixture.nativeElement.remove();
    });

    it('focusin dans l\'hôte appelle enter une fois pour le bloc', (): void => {
        host.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        host.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        expect(store.enter).toHaveBeenCalledWith('part', 7);
        expect(store.stateOf).toHaveBeenCalledWith('part:7');
    });

    it('focusout vers un élément interne ne libère pas', (): void => {
        q('.first').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        focusOut(q('.first'), q('.second'));
        expect(store.leave).not.toHaveBeenCalled();
    });

    it('focusout vers l\'extérieur libère', (): void => {
        q('.first').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        focusOut(q('.first'), q('.outside'));
        expect(store.leave).toHaveBeenCalledWith('part', 7);
    });

    it('focusout vers un overlay CDK ne libère pas, puis focusin extérieur libère', (): void => {
        const overlay: HTMLElement = document.createElement('div');
        overlay.className = 'cdk-overlay-container';
        const option: HTMLElement = document.createElement('button');
        overlay.appendChild(option);
        document.body.appendChild(overlay);
        created.push(overlay);

        q('.first').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        focusOut(q('.first'), option);
        expect(store.leave).not.toHaveBeenCalled();

        option.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        expect(store.leave).not.toHaveBeenCalled();

        q('.outside').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        expect(store.leave).toHaveBeenCalledTimes(1);
        expect(store.leave).toHaveBeenCalledWith('part', 7);

        q('.outside').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        expect(store.leave).toHaveBeenCalledTimes(1);
    });

    it('keydown, pointermove, wheel et input signalent une activité', (): void => {
        ['keydown', 'pointermove', 'wheel', 'input'].forEach((type: string): void => {
            q('.first').dispatchEvent(new Event(type, { bubbles: true }));
        });
        expect(store.activity).toHaveBeenCalledTimes(4);
        expect(store.activity).toHaveBeenCalledWith('part', 7);
    });

    it('état other : hôte inert et classe mho-locked-block', (): void => {
        expect(host.hasAttribute('inert')).toBe(false);
        state.set({ kind: 'other', user_id: 3, same_user: false });
        fixture.detectChanges();
        expect(host.hasAttribute('inert')).toBe(true);
        expect(host.classList.contains('mho-locked-block')).toBe(true);
        state.set({ kind: 'free' });
        fixture.detectChanges();
        expect(host.hasAttribute('inert')).toBe(false);
        expect(host.classList.contains('mho-locked-block')).toBe(false);
    });

    it('entrée null : aucun appel, jamais inert', (): void => {
        fixture.componentInstance.target.set(null);
        state.set({ kind: 'other', user_id: 3, same_user: false });
        fixture.detectChanges();
        store.leave.mockClear();
        q('.first').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        q('.first').dispatchEvent(new Event('keydown', { bubbles: true }));
        focusOut(q('.first'), q('.outside'));
        q('.outside').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        expect(store.enter).not.toHaveBeenCalled();
        expect(store.activity).not.toHaveBeenCalled();
        expect(store.leave).not.toHaveBeenCalled();
        expect(host.hasAttribute('inert')).toBe(false);
    });

    it('passage à null en étant entré libère le bloc', (): void => {
        q('.first').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        fixture.componentInstance.target.set(null);
        fixture.detectChanges();
        expect(store.leave).toHaveBeenCalledWith('part', 7);
    });

    it('destruction de l\'hôte libère le bloc occupé', (): void => {
        q('.first').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        fixture.destroy();
        expect(store.leave).toHaveBeenCalledWith('part', 7);
    });

    it('focusout sans cible, focus sur body : libère après la tâche', async (): Promise<void> => {
        q('.first').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        vi.spyOn(document, 'hasFocus').mockReturnValue(true);
        (document.activeElement as HTMLElement).blur();
        focusOut(q('.first'), null);
        expect(store.leave).not.toHaveBeenCalled();
        await new Promise<void>((resolve: () => void): void => void setTimeout(resolve));
        expect(store.leave).toHaveBeenCalledWith('part', 7);
    });

    it('pointerdown document hors bloc libère, dans un overlay non', (): void => {
        const overlay: HTMLElement = document.createElement('div');
        overlay.className = 'cdk-overlay-container';
        document.body.appendChild(overlay);
        created.push(overlay);
        q('.first').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        overlay.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        expect(store.leave).not.toHaveBeenCalled();
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        expect(store.leave).toHaveBeenCalledWith('part', 7);
    });

    it('changement de cible : libère l\'ancienne, puis entre dans la nouvelle', (): void => {
        q('.first').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        fixture.componentInstance.target.set({ kind: 'part', id: 8 });
        fixture.detectChanges();
        expect(store.leave).toHaveBeenCalledWith('part', 7);
        q('.first').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        expect(store.enter).toHaveBeenCalledWith('part', 8);
    });
});
