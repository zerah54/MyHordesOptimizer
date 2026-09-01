import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import moment from 'moment';
import { of } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { HeroSkill } from '../../_abstract_model/types/hero-skill.class';
import { HeroSkillsComponent } from './hero-skills.component';
import { NewHeroSkill } from './temp-hero-skills.const';

describe('HeroSkillsComponent', (): void => {
    let fixture: ComponentFixture<HeroSkillsComponent>;
    let component: HeroSkillsComponent;

    const single_class: NewHeroSkill[] = [
        {
            name: { [moment.locale()]: 'Compétences disponibles' },
            levels: [
                {
                    name: { [moment.locale()]: 'Habitant' },
                    skills: [{ [moment.locale()]: '4 places dans le sac à dos' }]
                },
                {
                    name: { [moment.locale()]: 'Héros niveau 1' },
                    pointsNeeded: 10,
                    skills: [{ [moment.locale()]: 'Compétence héroïque' }]
                }
            ]
        }
    ];

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [HeroSkillsComponent],
            providers: [{ provide: ApiService, useValue: { getHeroSkill: (): unknown => of([]) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(HeroSkillsComponent);
        component = fixture.componentInstance;
        component['new_hero_skills'] = single_class;
        fixture.detectChanges();
    });

    it('renders one expansion panel per skill class, titled with the class name', (): void => {
        const titles = fixture.debugElement.queryAll(By.css('mat-panel-title'));
        expect(titles.length).toBe(1);
        expect(titles[0].nativeElement.textContent.trim()).toBe('Compétences disponibles');
    });

    it('renders one table row per level, with its skills listed', (): void => {
        const rows = fixture.debugElement.queryAll(By.css('tr'));
        expect(rows.length).toBe(2);

        const skill_rows = fixture.debugElement.queryAll(By.css('.skill-row'));
        expect(skill_rows.length).toBe(2);
        expect(skill_rows[0].nativeElement.textContent).toContain('4 places dans le sac à dos');
        expect(skill_rows[1].nativeElement.textContent).toContain('Compétence héroïque');
    });

    it('shows the points needed for a level that requires hero points', (): void => {
        const points = fixture.debugElement.queryAll(By.css('small'));
        expect(points.length).toBe(1);
        expect(points[0].nativeElement.textContent).toContain('10');
    });

    it('populates old_hero_skills from the API on init', async (): Promise<void> => {
        const skill: HeroSkill = new HeroSkill();
        skill.days_needed = 3;

        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [HeroSkillsComponent],
            providers: [{ provide: ApiService, useValue: { getHeroSkill: (): unknown => of([skill]) } }]
        }).compileComponents();

        const other_fixture: ComponentFixture<HeroSkillsComponent> = TestBed.createComponent(HeroSkillsComponent);
        other_fixture.detectChanges();
        expect(other_fixture.componentInstance.old_hero_skills.length).toBe(1);
    });
});
