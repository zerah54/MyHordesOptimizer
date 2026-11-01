import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Aperçu statique des cases de la carte ; les couleurs viennent des variables `--mho-*` posées sur `<html>`. */
@Component({
    selector: 'mho-map-theme-preview',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './map-theme-preview.component.html',
    styleUrl: './map-theme-preview.component.scss'
})
export class MapThemePreviewComponent {
    protected readonly levels: readonly number[] = [0, 1, 2, 3];
    protected readonly ages: readonly string[] = ['green', 'yellow', 'orange', 'red'];
    protected readonly corners: readonly string[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
}
