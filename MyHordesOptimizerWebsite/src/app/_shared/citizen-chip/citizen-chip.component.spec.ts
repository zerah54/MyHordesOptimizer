import { ComponentFixture, TestBed } from '@angular/core/testing';
import moment from 'moment';
import { Observable, of } from 'rxjs';

import { DailyActionEnum } from '../../_abstract_model/enum/daily-action.enum';
import { HeroicActionEnum } from '../../_abstract_model/enum/heroic-action.enum';
import { HomeEnum } from '../../_abstract_model/enum/home.enum';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { HeroSkillNamesService } from '../../_abstract_model/services/hero-skill-names.service';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../_abstract_model/types/daily-action.class';
import { HeroSkillFamily } from '../../_abstract_model/types/hero-skill-levels';
import { HeroicActions } from '../../_abstract_model/types/heroic-actions.class';
import { Home } from '../../_abstract_model/types/home.class';
import { CitizenChipComponent } from './citizen-chip.component';

const DAY: number = 5;

describe('CitizenChipComponent', (): void => {
    let fixture: ComponentFixture<CitizenChipComponent>;

    /**
     * Fouineuse bannie : Tente, Cuisine 2, Trouvaille disponible, galeries faites ce jour.
     * @returns {Citizen} Citoyen.
     */
    function citizen(): Citizen {
        const result: Citizen = Object.assign(new Citizen(), { id: 1, name: 'Alice', is_shunned: true, job: JobEnum.SCAVENGER });
        result.home = Object.assign(new Home(), {
            content: [{ element: HomeEnum.HOUSE_LEVEL, value: 1 }, { element: HomeEnum.KITCHEN_LEVEL, value: 2 }, { element: HomeEnum.HAS_LOCK, value: false }]
        });
        result.heroic_actions = Object.assign(new HeroicActions(), {
            content: [{ element: HeroicActionEnum.HAS_LUCKYFIND, value: true }, { element: HeroicActionEnum.HAS_RESCUE, value: false }]
        });
        result.daily_actions = [Object.assign(new DailyAction(), { day: DAY, action_key: 'home_scavenge' })];
        return result;
    }

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CitizenChipComponent],
            providers: [{ provide: HeroSkillNamesService, useValue: { names: (): Observable<Readonly<Record<HeroSkillFamily, string>>> => of({ s: 'Stratégie', u: 'Prudence', p: 'P', e: 'E', r: 'R' }) } }]
        }).compileComponents();
        fixture = TestBed.createComponent(CitizenChipComponent);
        fixture.componentRef.setInput('citizen', citizen());
        fixture.componentRef.setInput('day', DAY);
        fixture.componentRef.setInput('actions', [DailyActionEnum.HOME_SCAVENGE, DailyActionEnum.HOME_CROWS]);
        fixture.detectChanges();
    });

    /**
     * Fiche ouverte, rattachée au conteneur de surimpression.
     * @returns {HTMLElement | null} Fiche.
     */
    function card(): HTMLElement | null {
        return document.querySelector<HTMLElement>('.mho-citizen-card');
    }

    /**
     * Ouvre la fiche au survol du pseudo.
     */
    function hover(): void {
        (fixture.nativeElement as HTMLElement).querySelector('button')?.dispatchEvent(new Event('mouseenter'));
        fixture.detectChanges();
    }

    it('affiche le métier à côté du pseudo, et le statut de banni', (): void => {
        const button: HTMLButtonElement = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;

        expect(button.textContent).toContain('Alice');
        expect(button.querySelector<HTMLImageElement>('img.job')?.alt).toBe(JobEnum.SCAVENGER.value.label);
        expect(button.querySelector('img.banned')).not.toBeNull();
        expect(card()).toBeNull();
    });

    it('au survol, la fiche donne maison, améliorations, pouvoirs disponibles et actions du jour', (): void => {
        hover();

        const text: string = card()?.textContent ?? '';
        expect(text).toContain(HomeEnum.HOUSE_LEVEL.value.house_options?.[1][moment.locale()] ?? '?');
        expect(text).toContain('Cuisine niv. 2');
        expect(text).toContain('Actions héroïques disponibles');
        expect(text).not.toContain('Verrou');
        expect(text).toContain('Trouvaille');
        expect(text).not.toContain('Sauvetage');
        expect(text).toContain('Creuser dans les galeries');
        expect(text).not.toContain('Cartographier le désert');
    });

    it('la fiche reflète une action cochée depuis (citoyen modifié en place)', (): void => {
        hover();
        expect(card()?.textContent).not.toContain('Cartographier le désert');
        (fixture.nativeElement as HTMLElement).querySelector('button')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        fixture.detectChanges();

        const citizen_value: Citizen = fixture.componentInstance.citizen();
        citizen_value.daily_actions = [...citizen_value.daily_actions, Object.assign(new DailyAction(), { day: DAY, action_key: 'home_crows' })];
        hover();

        expect(card()?.textContent).toContain('Cartographier le désert');
    });

    it('compétences : nom du groupe et du niveau (terme du jeu), sans les groupes nuls ou inconnus', (): void => {
        const citizen_value: Citizen = fixture.componentInstance.citizen();
        citizen_value.hero_skills = { s: 3, u: 0, p: null, e: null, r: null };
        hover();

        const text: string = card()?.textContent ?? '';
        expect(text).toContain('Compétences');
        expect(text).toContain('Stratégie : Expert');
        expect(text).not.toContain('Prudence');
    });

    it('niveaux inconnus (négatifs) : ni amélioration « niv. -1 », ni habitation « -1 »', (): void => {
        fixture.componentInstance.citizen().home = Object.assign(new Home(), {
            content: [{ element: HomeEnum.HOUSE_LEVEL, value: -1 }, { element: HomeEnum.KITCHEN_LEVEL, value: -1 }]
        });
        hover();

        const text: string = card()?.textContent ?? '';
        expect(text).not.toContain('-1');
        expect(text).toContain('Aucune connue');
    });

    it('maison affichée en colonnes par la page : habitation retirée, améliorations marquées pour être masquées sur grand écran', (): void => {
        hover();
        expect(card()?.querySelector('.upgrades.in-columns')).toBeNull();
        expect(card()?.textContent).toContain('Habitation');
        (fixture.nativeElement as HTMLElement).querySelector('button')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        fixture.componentRef.setInput('homeInColumns', true);
        hover();

        expect(card()?.textContent).not.toContain('Habitation');
        expect(card()?.querySelector('.upgrades.in-columns')?.textContent).toContain('Cuisine niv. 2');
    });

    it('Échap ferme la fiche', (): void => {
        hover();
        (fixture.nativeElement as HTMLElement).querySelector('button')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        fixture.detectChanges();

        expect(card()).toBeNull();
    });

    it('le clic ouvre et referme la fiche (écrans tactiles)', (): void => {
        const button: HTMLButtonElement = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
        button.click();
        fixture.detectChanges();
        expect(card()).not.toBeNull();
        expect(button.getAttribute('aria-expanded')).toBe('true');

        button.click();
        fixture.detectChanges();
        expect(card()).toBeNull();
    });
});
