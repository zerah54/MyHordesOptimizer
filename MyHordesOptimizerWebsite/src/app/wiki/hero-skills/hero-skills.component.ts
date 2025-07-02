import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { StandardColumn } from '../../_abstract_model/interfaces';
import { ApiService } from '../../_abstract_model/services/api.service';
import { Imports } from '../../_abstract_model/types/_types';
import { HeroSkill } from '../../_abstract_model/types/hero-skill.class';
import { NewHeroSkill, skills } from './temp-hero-skills.const';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule, MatSortModule, MatTableModule, MatExpansionModule];

@Component({
    selector: 'mho-hero-skills',
    templateUrl: './hero-skills.component.html',
    styleUrls: ['./hero-skills.component.scss'],
    host: { style: 'display: contents' },
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class HeroSkillsComponent implements OnInit {

    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    /** La liste des pouvoirs héroïques */
    public old_hero_skills!: HeroSkill[];
    /** La nouvelle liste des pouvoirs héroïques */
    public new_hero_skills: NewHeroSkill[] = skills;
    /** La liste des colonnes */
    public readonly columns: StandardColumn[] = [
        {id: 'icon', header: ''},
        {id: 'label', header: $localize`Pouvoir`, sticky: true},
        {id: 'days_needed', header: $localize`Jours héros nécessaires`},
        {id: 'description', header: $localize`Description`}
    ];

    private readonly api: ApiService = inject(ApiService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    ngOnInit(): void {
        this.api.getHeroSkill()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((old_hero_skills: HeroSkill[]) => {
                this.old_hero_skills = [...old_hero_skills];
            });
    }
}

