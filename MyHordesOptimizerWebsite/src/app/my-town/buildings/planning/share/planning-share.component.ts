import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { environment } from '../../../../../environments/environment';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { ClipboardService } from '../../../../_core/services/clipboard.service';
import { budgetPost, PostContext, programPost } from '../forum-post.util';
import { BuildingPlanDTO } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { itemLabel } from '../planning-labels.util';

const material_modules: Imports = [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule];

/** Entrée du menu : un message prêt à être collé sur le forum. */
interface ShareEntry {
    key: string;
    label: string;
    text: string;
}

/**
 * Bouton « Copier au format forum » : un menu avec un item par mode (budget, programme), un par message si le post est découpé.
 * Chaque pseudo est précédé de l'emote de son métier.
 */
@Component({
    selector: 'mho-planning-share',
    templateUrl: './planning-share.component.html',
    styleUrls: ['./planning-share.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class PlanningShareComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);

    private readonly clipboard: ClipboardService = inject(ClipboardService);
    private readonly locale: string = moment.locale();

    /** Messages disponibles ; vide quand le jour n'est pas évalué (jour passé). */
    protected readonly entries: Signal<ShareEntry[]> = computed((): ShareEntry[] => {
        const context: PostContext | null = this.context();
        if (context === null) {
            return [];
        }
        return [
            ...this.entriesOf('budget', $localize`Post budget`, budgetPost(context)),
            ...this.entriesOf('program', $localize`Post programme`, programPost(context)),
            ...this.entriesOf('program-review', $localize`Post programme sans ping (relecture)`, programPost(context, false))
        ];
    });

    /**
     * Copie un message dans le presse-papiers.
     * @param {ShareEntry} entry Message choisi.
     */
    protected copy(entry: ShareEntry): void {
        this.clipboard.copy(entry.text, $localize`Le message a bien été copié au format forum`);
    }

    private context(): PostContext | null {
        const plan: BuildingPlanDTO | null = this.store.selected_plan();
        const evaluation: PostContext['evaluation'] | null = this.store.evaluation();
        const content: PostContext['content'] | null = this.store.draft();
        if (plan === null || evaluation === null || content === null) {
            return null;
        }
        return {
            day: this.store.selected_day(),
            plan_name: plan.name,
            content,
            evaluation,
            buildings: this.store.buildings(),
            citizens: this.store.citizens(),
            homes: this.store.homes(),
            item_label: (item_id: number): string => itemLabel(this.store.items(), item_id, this.locale),
            website_url: environment.website_url,
            job_emotes: this.jobEmoteMap()
        };
    }

    /**
     * Emote forum du métier de chaque citoyen vivant dont le métier est connu.
     * @returns {ReadonlyMap<number, string>} Emote par identifiant de joueur.
     */
    private jobEmoteMap(): ReadonlyMap<number, string> {
        const emotes: Map<number, string> = new Map<number, string>();
        this.store.citizens_full().forEach((citizen: Citizen): void => {
            const forum_icon: string | undefined = citizen.job?.value.forum_icon;
            if (forum_icon !== undefined && forum_icon !== '') {
                emotes.set(citizen.id, `:${forum_icon}:`);
            }
        });
        return emotes;
    }

    private entriesOf(key: string, label: string, parts: string[]): ShareEntry[] {
        return parts.map((text: string, index: number): ShareEntry => ({
            key: `${key}:${index}`,
            label: parts.length > 1 ? $localize`${label}:label: — message ${index + 1}:index:/${parts.length}:count:` : label,
            text
        }));
    }
}
