import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, Directive, effect, ElementRef, inject, input, InputSignal, Signal, untracked } from '@angular/core';

import { expeditionLockKey, ExpeditionLockKind } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { ExpeditionLocksStore } from './expedition-locks.store';
import { BlockLockState } from './expedition-locks.util';

/** Bloc verrouillable : type et identifiant de l'entité. */
export interface ExpeditionLockTarget {
    kind: ExpeditionLockKind;
    id: number;
}

const FREE_STATE: BlockLockState = { kind: 'free' };
const OVERLAY_SELECTOR: string = '.cdk-overlay-container';

/** Rend un bloc de la page Expéditions verrouillable : prend le verrou à l'entrée, le libère à la sortie, grise le bloc s'il est tenu par un autre. */
@Directive({
    selector: '[mhoExpeditionLock]',
    host: {
        '[attr.inert]': 'inert_value()',
        '[class.mho-locked-block]': 'is_locked()',
        '(focusin)': 'onEnter()',
        '(pointerdown)': 'onEnter()',
        '(focusout)': 'onFocusOut($event)',
        '(keydown)': 'onActivity()',
        '(pointermove)': 'onActivity()',
        '(wheel)': 'onActivity()',
        '(input)': 'onActivity()',
    },
})
export class ExpeditionLockBlockDirective {

    /** Bloc à verrouiller ; `null` désactive la directive (hors mode édition). */
    public readonly mhoExpeditionLock: InputSignal<ExpeditionLockTarget | null> = input.required<ExpeditionLockTarget | null>();

    private readonly store: ExpeditionLocksStore = inject(ExpeditionLocksStore);
    private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly document: Document = inject(DOCUMENT);

    /** Bloc occupé par cette directive (conservé pour libérer même si l'entrée est devenue `null`). */
    private entered: ExpeditionLockTarget | null = null;
    private readonly onDocumentFocusIn: (event: FocusEvent) => void = (event: FocusEvent): void => {
        if (!this.isInside(event.target as Node | null)) {
            this.onLeave();
        }
    };

    private readonly onDocumentPointerDown: (event: PointerEvent) => void = (event: PointerEvent): void => {
        if (!this.isInside(event.target as Node | null)) {
            this.onLeave();
        }
    };

    private readonly state: Signal<BlockLockState> = computed((): BlockLockState => {
        const target: ExpeditionLockTarget | null = this.mhoExpeditionLock();
        return target === null ? FREE_STATE : this.store.stateOf(expeditionLockKey(target.kind, target.id))();
    });
    protected readonly is_locked: Signal<boolean> = computed((): boolean => this.state().kind === 'other');
    protected readonly inert_value: Signal<'' | null> = computed((): '' | null => (this.is_locked() ? '' : null));

    public constructor() {
        effect((): void => {
            const target: ExpeditionLockTarget | null = this.mhoExpeditionLock();
            const entered: ExpeditionLockTarget | null = untracked((): ExpeditionLockTarget | null => this.entered);
            if (entered !== null && (target === null || target.kind !== entered.kind || target.id !== entered.id)) {
                untracked((): void => this.onLeave());
            }
        });
        inject(DestroyRef).onDestroy((): void => this.onLeave());
    }

    /** Prend le verrou au premier focus ou clic dans le bloc. */
    protected onEnter(): void {
        const target: ExpeditionLockTarget | null = this.mhoExpeditionLock();
        if (target === null || this.entered !== null) {
            return;
        }
        this.entered = target;
        this.document.addEventListener('focusin', this.onDocumentFocusIn);
        this.document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
        void this.store.enter(target.kind, target.id);
    }

    /** Libère le verrou quand le focus part hors du bloc et de l'overlay CDK ; sans cible, revérifie après la tâche courante (fenêtre toujours active). */
    protected onFocusOut(event: FocusEvent): void {
        if (this.entered === null) {
            return;
        }
        if (event.relatedTarget !== null) {
            if (!this.isInside(event.relatedTarget as Node)) {
                this.onLeave();
            }
            return;
        }
        setTimeout((): void => {
            if (this.document.hasFocus() && !this.isInside(this.document.activeElement)) {
                this.onLeave();
            }
        });
    }

    /** Signale une activité pour prolonger le verrou. */
    protected onActivity(): void {
        const target: ExpeditionLockTarget | null = this.mhoExpeditionLock();
        if (target !== null) {
            this.store.activity(target.kind, target.id);
        }
    }

    /** Libère le bloc occupé et retire les écouteurs document. */
    private onLeave(): void {
        const target: ExpeditionLockTarget | null = this.entered;
        if (target === null) {
            return;
        }
        this.entered = null;
        this.document.removeEventListener('focusin', this.onDocumentFocusIn);
        this.document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
        this.store.leave(target.kind, target.id);
    }

    /** Indique si le nœud est dans l'hôte ou dans un overlay CDK. */
    private isInside(node: Node | null): boolean {
        return node !== null && (this.host.contains(node) || (this.document.querySelector(OVERLAY_SELECTOR)?.contains(node) ?? false));
    }
}
