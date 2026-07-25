import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, InputSignal, TemplateRef } from '@angular/core';

import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [NgTemplateOutlet];

/**
 * Cellule à rendu différé (`@defer (on viewport)`).
 *
 * Deux façons de fournir le contenu :
 * - `[content]` (+ `[context]`) : un `TemplateRef` rendu via `ngTemplateOutlet` DANS la vue de ce composant.
 *   À privilégier quand le contenu est un `ng-template` partagé (ex : cellules mutualisées entre plusieurs
 *   modes d'affichage) — l'outlet reste dans la même vue, il ne traverse pas la frontière de projection.
 * - `<ng-content>` : contenu projeté classique, pour du contenu direct (divs, composants).
 *
 * Projeter un `ngTemplateOutlet` externe à travers `<ng-content>` sous `@defer` ne rend pas le contenu :
 * c'est précisément pour ça que l'entrée `[content]` existe.
 */
@Component({
    selector: 'mho-deferred-cell',
    templateUrl: './deferred-cell.component.html',
    styleUrl: './deferred-cell.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common]
})
export class DeferredCellComponent {
    /** Template optionnel à rendre dans le bloc différé. Si absent, on rend le contenu projeté (`<ng-content>`). */
    public readonly content: InputSignal<TemplateRef<unknown> | undefined> = input<TemplateRef<unknown> | undefined>(undefined);
    /** Contexte passé au template `content`. */
    public readonly context: InputSignal<object | null> = input<object | null>(null);
}
