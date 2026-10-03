import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { ApiService } from '../../_abstract_model/services/api.service';
import { Imports } from '../../_abstract_model/types/_types';
import { HeroSkill } from '../../_abstract_model/types/hero-skill.class';
import { TypedCellDefDirective } from '../../_core/directives/typed-cell-def.directive';
import { buildHeroSkillTree, citizenBaseGroup, HeroSkillGroupView } from './hero-skills.util';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [];
const directives: Imports = [TypedCellDefDirective];
const pipes: Imports = [];
const material_modules: Imports = [MatTableModule, MatExpansionModule];

/**
 * Arbre des compétences de héros : chaque groupe et ses niveaux, lus dans les données du jeu servies
 * par l'API (plus de liste recopiée à la main, qui prenait du retard sur le jeu).
 */
@Component({
    selector: 'mho-hero-skills',
    templateUrl: './hero-skills.component.html',
    styleUrls: ['./hero-skills.component.scss'],
    imports: [...angular_common, ...components, ...directives, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroSkillsComponent implements OnInit {

    /** Le dossier dans lequel sont stockées les images */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    private readonly api: ApiService = inject(ApiService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly locale: string = moment.locale();

    private readonly skills: WritableSignal<readonly HeroSkill[]> = signal([]);

    /** Ce que tout habitant a, puis les groupes de l'arbre dans l'ordre du jeu */
    protected readonly groups: Signal<readonly HeroSkillGroupView[]> = computed((): readonly HeroSkillGroupView[] =>
        [citizenBaseGroup(), ...buildHeroSkillTree(this.skills(), this.locale)]);

    public ngOnInit(): void {
        this.api.getHeroSkill()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((skills: HeroSkill[]): void => this.skills.set(skills));
    }
}
