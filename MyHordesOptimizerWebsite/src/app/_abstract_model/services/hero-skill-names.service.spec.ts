import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import { HeroSkill } from '../types/hero-skill.class';
import { HERO_SKILL_LETTERS, HeroSkillFamily } from '../types/hero-skill-levels';
import { ApiService } from './api.service';
import { HeroSkillNamesService } from './hero-skill-names.service';

describe('HeroSkillNamesService', (): void => {
    /**
     * Service avec un référentiel donné.
     * @param {Observable<HeroSkill[]>} skills$ Référentiel renvoyé.
     * @returns {{ service: HeroSkillNamesService; get: ReturnType<typeof vi.fn> }} Service et espion.
     */
    function create(skills$: Observable<HeroSkill[]>): { service: HeroSkillNamesService; get: ReturnType<typeof vi.fn> } {
        const get: ReturnType<typeof vi.fn> = vi.fn((): Observable<HeroSkill[]> => skills$);
        TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: { getHeroSkill: get } }] });
        return { service: TestBed.inject(HeroSkillNamesService), get };
    }

    it('noms des groupes, chargés une seule fois', (): void => {
        const created: { service: HeroSkillNamesService; get: ReturnType<typeof vi.fn> } =
            create(of([Object.assign(new HeroSkill(), { legacy: false, group: { fr: 'Stratégie', en: 'Stratégie', de: 'Stratégie', es: 'Stratégie' }, group_sort: 0 })]));
        const service: HeroSkillNamesService = created.service;
        const get: ReturnType<typeof vi.fn> = created.get;
        let names: Readonly<Record<HeroSkillFamily, string>> | undefined;
        service.names().subscribe((value: Readonly<Record<HeroSkillFamily, string>>): void => {
            names = value;
        });
        service.names().subscribe();

        expect(names?.s).toBe('Stratégie');
        expect(names?.u).toBe('U');
        expect(get).toHaveBeenCalledTimes(1);
    });

    it('repli sur les lettres si le référentiel est indisponible', (): void => {
        const service: HeroSkillNamesService = create(throwError((): Error => new Error('500'))).service;
        let names: Readonly<Record<HeroSkillFamily, string>> | undefined;
        service.names().subscribe((value: Readonly<Record<HeroSkillFamily, string>>): void => {
            names = value;
        });

        expect(names).toEqual(HERO_SKILL_LETTERS);
    });
});
