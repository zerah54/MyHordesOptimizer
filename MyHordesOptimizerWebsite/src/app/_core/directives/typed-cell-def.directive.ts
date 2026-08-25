import { CdkCellDef, CdkTable } from '@angular/cdk/table';
import { Directive, input, InputSignal } from '@angular/core';
import { MatCellDef } from '@angular/material/table';

/**
 * Remplace `matCellDef` pour typer la ligne de cellule sur le type générique de la `mat-table`
 * hôte (récupérée via une référence de gabarit, ex. `#table`), au lieu de `any`.
 * Usage : `<table #table ...>` puis `*matCellDef="let row; table: table"`.
 */
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector -- doit reprendre le sélecteur natif matCellDef pour le remplacer
    selector: '[matCellDef]',
    providers: [{ provide: MatCellDef, useExisting: TypedCellDefDirective }],
})
export class TypedCellDefDirective<T> extends CdkCellDef {
    public matCellDefTable: InputSignal<CdkTable<T>> = input.required();

    public static ngTemplateContextGuard<T>(
        _dir: TypedCellDefDirective<T>,
        _ctx: unknown,
    ): _ctx is { $implicit: T; index: number } {
        return true;
    }
}
