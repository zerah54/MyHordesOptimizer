import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import moment from 'moment';

import { UpdateInfoDTO } from '../../_abstract_model/dto/update-info.dto';
import { UpdateInfo } from '../../_abstract_model/types/update-info.class';
import { LastUpdateComponent } from './last-update.component';

describe('LastUpdateComponent', (): void => {
    let fixture: ComponentFixture<LastUpdateComponent>;

    /** Construit un UpdateInfo dont la date de mise à jour est décalée de `minutesAgo` minutes dans le passé. */
    function createUpdateInfo(minutesAgo: number, username: string = 'Alice'): UpdateInfo {
        const dto: UpdateInfoDTO = {
            updateTime: moment().subtract(minutesAgo, 'minutes').toDate(),
            userId: '1',
            userName: username,
            userKey: 'key'
        };
        return new UpdateInfo(dto);
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [LastUpdateComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(LastUpdateComponent);
    });

    it('shows the "never updated" icon and text when lastUpdateInfo is undefined', (): void => {
        fixture.componentRef.setInput('lastUpdateInfo', undefined);
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img.src).toContain('img/time-ago/no_update.svg');
        expect(img.width).toBe(24);
        expect(img.height).toBe(24);
        expect(fixture.nativeElement.textContent).toContain('Jamais mis à jour');
    });

    it('shows the "never updated" state when lastUpdateInfo has no update_time', (): void => {
        fixture.componentRef.setInput('lastUpdateInfo', new UpdateInfo());
        fixture.detectChanges();

        const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img.src).toContain('img/time-ago/no_update.svg');
    });

    it('shows a tooltip on the "never updated" icon by default', (): void => {
        fixture.componentRef.setInput('lastUpdateInfo', undefined);
        fixture.detectChanges();

        const tooltip: MatTooltip = fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);
        expect(tooltip.message).toBe('Jamais mis à jour');
    });

    it('renders no matTooltip directive on the "never updated" icon when noTooltip is true', (): void => {
        fixture.componentRef.setInput('lastUpdateInfo', undefined);
        fixture.componentRef.setInput('noTooltip', true);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.directive(MatTooltip))).toBeNull();
    });

    it('hides the "never updated" text when hideDetails is true', (): void => {
        fixture.componentRef.setInput('lastUpdateInfo', undefined);
        fixture.componentRef.setInput('hideDetails', true);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).not.toContain('Jamais mis à jour');
    });

    it('shows the username and relative time when updated and no thresholds are provided', (): void => {
        fixture.componentRef.setInput('lastUpdateInfo', createUpdateInfo(5, 'Alice'));
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Alice');
    });

    it('renders no icon when update info exists but no thresholds are provided', (): void => {
        fixture.componentRef.setInput('lastUpdateInfo', createUpdateInfo(5));
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('img'))).toBeNull();
    });

    it('hides the detail text when hideDetails is true even with an update', (): void => {
        fixture.componentRef.setInput('lastUpdateInfo', createUpdateInfo(5, 'Alice'));
        fixture.componentRef.setInput('hideDetails', true);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).not.toContain('Alice');
    });

    describe('threshold-based icon selection', (): void => {
        const thresholds: [number, number, number, number] = [5, 15, 30, 60];

        it('uses icon 1 when the update is within the first threshold', (): void => {
            fixture.componentRef.setInput('lastUpdateInfo', createUpdateInfo(2));
            fixture.componentRef.setInput('thresholds', thresholds);
            fixture.detectChanges();

            const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
            expect(img.src).toContain('time_ago_1.svg');
        });

        it('uses icon 2 when the update is within the second threshold', (): void => {
            fixture.componentRef.setInput('lastUpdateInfo', createUpdateInfo(10));
            fixture.componentRef.setInput('thresholds', thresholds);
            fixture.detectChanges();

            const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
            expect(img.src).toContain('time_ago_2.svg');
        });

        it('uses icon 3 when the update is within the third threshold', (): void => {
            fixture.componentRef.setInput('lastUpdateInfo', createUpdateInfo(20));
            fixture.componentRef.setInput('thresholds', thresholds);
            fixture.detectChanges();

            const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
            expect(img.src).toContain('time_ago_3.svg');
        });

        it('uses icon 4 when the update is within the fourth threshold', (): void => {
            fixture.componentRef.setInput('lastUpdateInfo', createUpdateInfo(45));
            fixture.componentRef.setInput('thresholds', thresholds);
            fixture.detectChanges();

            const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
            expect(img.src).toContain('time_ago_4.svg');
        });

        it('uses icon 5 when the update exceeds all thresholds', (): void => {
            fixture.componentRef.setInput('lastUpdateInfo', createUpdateInfo(90));
            fixture.componentRef.setInput('thresholds', thresholds);
            fixture.detectChanges();

            const img: HTMLImageElement = fixture.debugElement.query(By.css('img')).nativeElement;
            expect(img.src).toContain('time_ago_5.svg');
        });
    });

    describe('icon tooltip content', (): void => {
        const thresholds: [number, number, number, number] = [5, 15, 30, 60];

        it('shows only the formatted date on the icon tooltip when the detail text is already visible', (): void => {
            fixture.componentRef.setInput('lastUpdateInfo', createUpdateInfo(2, 'Alice'));
            fixture.componentRef.setInput('thresholds', thresholds);
            fixture.detectChanges();

            const tooltip: MatTooltip = fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);
            expect(tooltip.message).not.toContain('Alice');
            expect(tooltip.message.length).toBeGreaterThan(0);
        });

        it('shows the full detail (username + relative time) on the icon tooltip when hideDetails hides the text', (): void => {
            fixture.componentRef.setInput('lastUpdateInfo', createUpdateInfo(2, 'Alice'));
            fixture.componentRef.setInput('thresholds', thresholds);
            fixture.componentRef.setInput('hideDetails', true);
            fixture.detectChanges();

            const tooltip: MatTooltip = fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);
            expect(tooltip.message).toContain('Alice');
        });

        it('empties the icon tooltip when noTooltip is true, even with thresholds and hideDetails', (): void => {
            fixture.componentRef.setInput('lastUpdateInfo', createUpdateInfo(2, 'Alice'));
            fixture.componentRef.setInput('thresholds', thresholds);
            fixture.componentRef.setInput('hideDetails', true);
            fixture.componentRef.setInput('noTooltip', true);
            fixture.detectChanges();

            const tooltip: MatTooltip = fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);
            expect(tooltip.message).toBe('');
        });
    });

    it('does not apply the align-right class by default', (): void => {
        fixture.componentRef.setInput('lastUpdateInfo', undefined);
        fixture.detectChanges();

        const host: HTMLElement = fixture.debugElement.query(By.css('.mho-last-update')).nativeElement;
        expect(host.classList.contains('align-right')).toBeFalse();
    });

    it('applies the align-right class when alignRight is true', (): void => {
        fixture.componentRef.setInput('lastUpdateInfo', undefined);
        fixture.componentRef.setInput('alignRight', true);
        fixture.detectChanges();

        const host: HTMLElement = fixture.debugElement.query(By.css('.mho-last-update')).nativeElement;
        expect(host.classList.contains('align-right')).toBeTrue();
    });
});
