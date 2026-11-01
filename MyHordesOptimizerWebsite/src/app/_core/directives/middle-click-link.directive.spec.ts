import { APP_BASE_HREF } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { MockInstance } from 'vitest';

import { MiddleClickLinkDirective, RouteCommands } from './middle-click-link.directive';

const MIDDLE_BUTTON: number = 1;
const LEFT_BUTTON: number = 0;

@Component({
    template: `
        <div [mhoMiddleClickLink]="commands()" class="host">
            <span (auxclick)="$event.stopPropagation()" class="excluded"></span>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MiddleClickLinkDirective],
})
class HostComponent {
    public readonly commands: WritableSignal<RouteCommands | null> = signal<RouteCommands | null>(['/profile', 42]);
}

describe('MiddleClickLinkDirective', (): void => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HTMLElement;
    let openSpy: MockInstance<typeof window.open>;

    function dispatch(target: HTMLElement, type: 'mousedown' | 'auxclick', button: number): MouseEvent {
        const event: MouseEvent = new MouseEvent(type, { button, bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        return event;
    }

    beforeEach((): void => {
        TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [provideRouter([]), { provide: APP_BASE_HREF, useValue: '/fr/' }],
        });
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        host = fixture.nativeElement.querySelector('.host');
        openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    });

    afterEach((): void => openSpy.mockRestore());

    it('ouvre la route dans un nouvel onglet au clic molette, base href compris', (): void => {
        dispatch(host, 'auxclick', MIDDLE_BUTTON);
        expect(openSpy).toHaveBeenCalledExactlyOnceWith('/fr/profile/42', '_blank', 'noopener');
    });

    it('ignore les autres boutons', (): void => {
        dispatch(host, 'auxclick', 2);
        expect(dispatch(host, 'mousedown', LEFT_BUTTON).defaultPrevented).toBe(false);
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('bloque le défilement automatique à l\'appui molette', (): void => {
        expect(dispatch(host, 'mousedown', MIDDLE_BUTTON).defaultPrevented).toBe(true);
    });

    it('ne fait rien si la route est null', (): void => {
        fixture.componentInstance.commands.set(null);
        fixture.detectChanges();
        expect(dispatch(host, 'mousedown', MIDDLE_BUTTON).defaultPrevented).toBe(false);
        dispatch(host, 'auxclick', MIDDLE_BUTTON);
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('n\'ouvre rien depuis un descendant qui arrête la propagation', (): void => {
        dispatch(fixture.nativeElement.querySelector('.excluded'), 'auxclick', MIDDLE_BUTTON);
        expect(openSpy).not.toHaveBeenCalled();
    });
});
