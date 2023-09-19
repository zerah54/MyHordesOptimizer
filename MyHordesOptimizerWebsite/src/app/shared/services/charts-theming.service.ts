import { Injectable } from '@angular/core';
import Chart from 'chart.js/auto';
import { Theme } from '../../_abstract_model/interfaces';

@Injectable()
export class ChartsThemingService {

    private readonly DARK_THEME_GRAPH_COLOR: string = 'rgba(255, 255, 255, 0.9)';
    private readonly DARK_THEME_AXIS_COLOR: string = 'rgba(255, 255, 255, 0.2)';


    private readonly DARK_THEMES: (string | undefined)[] = [undefined, 'brown', ''];

    public defineColorsWithTheme(selected_theme: Theme | undefined): void {
        const is_dark_theme: boolean = this.DARK_THEMES.some((dark_theme: string | undefined) => selected_theme?.class === dark_theme);
        if (is_dark_theme) {
            this.defineDarkChartsTheming();
        }
    }

    private defineDarkChartsTheming(): void {
        Chart.defaults.color = this.DARK_THEME_GRAPH_COLOR;
        Chart.defaults.borderColor = this.DARK_THEME_AXIS_COLOR;
        Chart.defaults.backgroundColor = this.DARK_THEME_GRAPH_COLOR;
        Chart.defaults.elements.line.borderColor = this.DARK_THEME_AXIS_COLOR;
        Chart.defaults.elements.arc.borderColor = 'transparent';
    }

}
