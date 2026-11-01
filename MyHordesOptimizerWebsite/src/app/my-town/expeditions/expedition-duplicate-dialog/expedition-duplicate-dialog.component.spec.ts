import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { Mock } from 'vitest';

import { ExpeditionDuplicateDialogComponent, ExpeditionDuplicateDialogData } from './expedition-duplicate-dialog.component';

describe('ExpeditionDuplicateDialogComponent', (): void => {
    let fixture: ComponentFixture<ExpeditionDuplicateDialogComponent>;
    let close: Mock<(result?: unknown) => void>;

    async function render(data: ExpeditionDuplicateDialogData): Promise<void> {
        close = vi.fn();
        await TestBed.configureTestingModule({
            imports: [ExpeditionDuplicateDialogComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useValue: { close } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(ExpeditionDuplicateDialogComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function option(field: string): HTMLInputElement | null {
        return root().querySelector<HTMLInputElement>(`mat-checkbox[data-field="${field}"] input`);
    }

    function toggle(field: string): void {
        option(field)?.click();
        fixture.detectChanges();
    }

    function submit(): void {
        root().querySelector<HTMLButtonElement>('button[data-action="confirm"]')?.click();
    }

    it('propose tout de dupliquer par défaut', async (): Promise<void> => {
        await render({ hasRoute: true });

        submit();

        expect(close).toHaveBeenCalledWith({ keepRoute: true, keepGeneralOrders: true, keepRouteOrders: true });
    });

    it('ne parle pas de tracé pour une expédition sans tracé', async (): Promise<void> => {
        await render({ hasRoute: false });

        expect(option('route')).toBeNull();
        expect(option('route-orders')).toBeNull();
        submit();

        expect(close).toHaveBeenCalledWith({ keepRoute: false, keepGeneralOrders: true, keepRouteOrders: false });
    });

    it('sans le tracé, ne propose plus ses consignes et ne les garde pas', async (): Promise<void> => {
        await render({ hasRoute: true });

        toggle('route');

        expect(option('route-orders')).toBeNull();
        submit();
        expect(close).toHaveBeenCalledWith({ keepRoute: false, keepGeneralOrders: true, keepRouteOrders: false });
    });

    it('permet de garder le tracé sans ses consignes', async (): Promise<void> => {
        await render({ hasRoute: true });

        toggle('route-orders');
        submit();

        expect(close).toHaveBeenCalledWith({ keepRoute: true, keepGeneralOrders: true, keepRouteOrders: false });
    });

    it('permet de ne pas dupliquer les consignes générales', async (): Promise<void> => {
        await render({ hasRoute: true });

        toggle('general-orders');
        submit();

        expect(close).toHaveBeenCalledWith({ keepRoute: true, keepGeneralOrders: false, keepRouteOrders: true });
    });
});
