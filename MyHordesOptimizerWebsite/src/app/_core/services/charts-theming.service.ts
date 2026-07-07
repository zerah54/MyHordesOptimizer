import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import Chart from 'chart.js/auto';
import { Theme } from '../../_abstract_model/interfaces';

@Injectable({ providedIn: 'root' })
export class ChartsThemingService {

    private readonly document: Document = inject(DOCUMENT);

    private readonly FALLBACK_TEXT_COLOR: string = 'rgba(255, 255, 255, 0.9)';

    public defineColorsWithTheme(_selected_theme: Theme | undefined): void {
        Chart.defaults.color = this.getThemeTextColor();
    }

    private getThemeTextColor(): string {
        const on_surface: string = getComputedStyle(this.document.body)
            .getPropertyValue('--mat-sys-on-surface')
            .trim();
        return on_surface || this.FALLBACK_TEXT_COLOR;
    }

}
