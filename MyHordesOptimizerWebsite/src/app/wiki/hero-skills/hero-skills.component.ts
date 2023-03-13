import { Component, HostBinding, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { AutoDestroy } from 'src/app/shared/decorators/autodestroy.decorator';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { HORDES_IMG_REPO } from './../../_abstract_model/const';
import { HeroSkill } from './../../_abstract_model/types/hero-skill.class';

@Component({
    selector: 'mho-hero-skills',
    templateUrl: './hero-skills.component.html',
    styleUrls: ['./hero-skills.component.scss']
})
export class HeroSkillsComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    /** La liste des bâtiments du jeu */
    public hero_skills!: HeroSkill[];
    /** La datasource pour le tableau */
    public datasource: MatTableDataSource<HeroSkill> = new MatTableDataSource();
    /** La liste des colonnes */
    public readonly columns: HeroSkillColumns[] = [
        { id: 'icon', header: `` },
        { id: 'label', header: $localize`Pouvoir` },
        { id: 'days_needed', header: $localize`Jours héros nécessaires` },
        { id: 'description', header: $localize`Description` }
    ];
    /** La liste des colonnes */
    public readonly columns_ids: string[] = this.columns.map((column: HeroSkillColumns) => column.id);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getHeroSkill()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((hero_skill: HeroSkill[]) => {
                this.hero_skills = hero_skill;
                this.datasource.data = [...hero_skill];
            });
    }
}

interface HeroSkillColumns {
    header: string;
    id: string;
}
