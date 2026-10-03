import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';

import { Imports } from '../../_abstract_model/types/_types';
import { ClipboardService } from '../../_core/services/clipboard.service';
import { AccordionComponent } from '../../_shared/accordion/accordion.component';
import { TUTORIAL_ROUTE_DATA_KEY, TutorialPage } from '../_model/tutorial.model';
import { tutorialToForum } from '../_model/tutorial-forum.util';

const angular_common: Imports = [];
const components: Imports = [AccordionComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatIconModule, MatMenuModule, MatTooltipModule];

/**
 * Page de tutoriel générique : son contenu vient des données de la route
 * (`data: { tutorial: … }`, voir `tutorials.routes.ts` et le dossier `content`).
 */
@Component({
    selector: 'mho-tutorial-page',
    templateUrl: './tutorial-page.component.html',
    styleUrls: ['./tutorial-page.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TutorialPageComponent {
    private readonly clipboard: ClipboardService = inject(ClipboardService);
    private readonly document: Document = inject<Document>(DOCUMENT);

    /** Le contenu d'une route ne change pas : une instance par navigation. */
    protected readonly page: TutorialPage = inject(ActivatedRoute).snapshot.data[TUTORIAL_ROUTE_DATA_KEY] as TutorialPage;

    protected copyUrl(): void {
        this.clipboard.copy(this.document.location.href, $localize`Le lien a bien été copié`);
    }

    protected shareForum(): void {
        this.clipboard.copy(tutorialToForum(this.page), $localize`Le texte a bien été copié`);
    }
}
