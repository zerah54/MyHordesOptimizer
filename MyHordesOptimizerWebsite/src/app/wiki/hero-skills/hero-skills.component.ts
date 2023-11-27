import { Component, HostBinding, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { StandardColumn } from '../../_abstract_model/interfaces';
import { ApiService } from '../../_abstract_model/services/api.service';
import { HeroSkill } from '../../_abstract_model/types/hero-skill.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { ColumnIdPipe } from '../../shared/pipes/column-id.pipe';
import { MatSortModule } from '@angular/material/sort';
import { NgIf, NgFor, NgSwitch, NgSwitchCase, NgOptimizedImage, NgSwitchDefault } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'mho-hero-skills',
    templateUrl: './hero-skills.component.html',
    styleUrls: ['./hero-skills.component.scss'],
    standalone: true,
    imports: [MatCardModule, NgIf, MatTableModule, MatSortModule, NgFor, NgSwitch, NgSwitchCase, NgOptimizedImage, NgSwitchDefault, ColumnIdPipe]
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
    public readonly columns: StandardColumn[] = [
        { id: 'icon', header: '' },
        { id: 'label', header: $localize`Pouvoir`, sticky: true },
        { id: 'days_needed', header: $localize`Jours héros nécessaires` },
        { id: 'description', header: $localize`Description` }
    ];

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiService) {

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

