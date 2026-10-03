import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import moment from 'moment';
import { of } from 'rxjs';

import { HeroSkillDTO } from '../../_abstract_model/dto/hero-skill.dto';
import { ApiService } from '../../_abstract_model/services/api.service';
import { HeroSkill } from '../../_abstract_model/types/hero-skill.class';
import { HeroSkillsComponent } from './hero-skills.component';

function makeSkill(dto: Partial<HeroSkillDTO>): HeroSkill {
    return new HeroSkill({ name: 'skill', description: {}, icon: '', label: {}, nbUses: 0, daysNeeded: 0, ...dto });
}

describe('HeroSkillsComponent', (): void => {
    let fixture: ComponentFixture<HeroSkillsComponent>;

    beforeEach(async (): Promise<void> => {
        const locale: string = moment.locale();
        const skills: HeroSkill[] = [
            makeSkill({ name: 'legacy', legacy: true, daysNeeded: 3 }),
            makeSkill({
                name: 'super_strategist_1', group: { [locale]: 'Stratège', de: 'Strategie' }, groupSort: 0, level: 1, daysNeeded: 40,
                bullets: { [locale]: ['Ration d\'eau'], de: ['Ration Wasser'] }
            }),
            makeSkill({
                name: 'super_strategist_0', group: { [locale]: 'Stratège', de: 'Strategie' }, groupSort: 0, level: 0,
                bullets: { [locale]: ['Accès au tableau noir'], de: ['Zugang zum Schwarzen Brett'] }
            })
        ];
        await TestBed.configureTestingModule({
            imports: [HeroSkillsComponent],
            providers: [{ provide: ApiService, useValue: { getHeroSkill: (): unknown => of(skills) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(HeroSkillsComponent);
        fixture.detectChanges();
    });

    it('renders the citizen base block, then one panel per group of the skill tree', (): void => {
        const titles: string[] = fixture.debugElement.queryAll(By.css('mat-panel-title'))
            .map((title: { nativeElement: HTMLElement }): string => title.nativeElement.textContent?.trim() ?? '');

        expect(titles).toEqual(['Compétences disponibles', 'Stratège']);
    });

    it('lists the levels of a group in order, with their advantages and the points they need', (): void => {
        const panels: HTMLElement[] = fixture.debugElement.queryAll(By.css('mat-expansion-panel'))
            .map((panel: { nativeElement: HTMLElement }): HTMLElement => panel.nativeElement);
        const rows: HTMLElement[] = Array.from(panels[1].querySelectorAll('tr'));

        expect(rows.length).toBe(2);
        expect(rows[0].textContent).toContain('Débutant');
        expect(rows[0].textContent).toContain('Accès au tableau noir');
        expect(rows[0].querySelector('small')).toBeNull();
        expect(rows[1].textContent).toContain('Apprenti');
        expect(rows[1].querySelector('small')?.textContent).toContain('40');
    });
});
