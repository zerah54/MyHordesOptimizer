import { inject, Injectable } from '@angular/core';
import moment from 'moment';
import { catchError, map, Observable, of, shareReplay, take } from 'rxjs';

import { HeroSkill } from '../types/hero-skill.class';
import { HERO_SKILL_LETTERS, HeroSkillFamily, heroSkillGroupNames } from '../types/hero-skill-levels';
import { ApiService } from './api.service';

/** Noms des groupes de compétences héroïques, lus une fois dans le référentiel (lettres à défaut). */
@Injectable({ providedIn: 'root' })
export class HeroSkillNamesService {

    private readonly api: ApiService = inject(ApiService);
    private cache: Observable<Readonly<Record<HeroSkillFamily, string>>> | null = null;

    /**
     * Nom de chaque groupe.
     * @returns {Observable<Readonly<Record<HeroSkillFamily, string>>>} Noms, partagés entre abonnés.
     */
    public names(): Observable<Readonly<Record<HeroSkillFamily, string>>> {
        this.cache ??= this.api.getHeroSkill().pipe(
            take(1),
            map((skills: HeroSkill[]): Readonly<Record<HeroSkillFamily, string>> => heroSkillGroupNames(skills, moment.locale())),
            catchError((): Observable<Readonly<Record<HeroSkillFamily, string>>> => of(HERO_SKILL_LETTERS)),
            shareReplay(1)
        );
        return this.cache;
    }
}
