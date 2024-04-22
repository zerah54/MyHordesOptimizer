import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable, Subscriber } from 'rxjs';
import {
    getItemsWithExpirationDate,
    getRuinsWithExpirationDate,
    getTown,
    setItemsWithExpirationDate,
    setRuinsWithExpirationDate,
} from '../../shared/utilities/localstorage.util';
import { HeroSkillDTO } from '../dto/hero-skill.dto';
import { ItemDTO } from '../dto/item.dto';
import { RecipeDTO } from '../dto/recipe.dto';
import { RuinDTO } from '../dto/ruin.dto';
import { dtoToModelArray } from '../types/_common.class';
import { HeroSkill } from '../types/hero-skill.class';
import { Item } from '../types/item.class';
import { Recipe } from '../types/recipe.class';
import { Ruin } from '../types/ruin.class';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class ApiService extends GlobalService {

    /** La locale */
    private readonly locale: string = moment.locale();

    constructor(_http: HttpClient) {
        super(_http);
    }

    /**
     * Récupère la liste des objets existants
     *
     * @returns {Observable<Item[]>}
     */
    public getItems(force?: boolean): Observable<Item[]> {
        return new Observable((sub: Subscriber<Item[]>) => {
            const saved_items: Item[] = getItemsWithExpirationDate();
            if (saved_items && saved_items.length > 0 && !force) {
                sub.next(saved_items);
            } else {
                super.get<ItemDTO[]>(this.API_URL + `/Fetcher/items?${getTown()?.town_id ? 'townId=' + getTown()?.town_id : ''}`)
                    .subscribe({
                        next: (response: HttpResponse<ItemDTO[]>) => {
                            const items: Item[] = dtoToModelArray(Item, response.body).filter((item: Item) => item.id !== 302);
                            setItemsWithExpirationDate(items);
                            sub.next(items);
                        },
                        error: (error: HttpErrorResponse) => {
                            sub.error(error);
                        }
                    });
            }
        });
    }

    /**
     * Récupère la liste des bâtiments
     *
     * @returns {Observable<Ruin[]>}
     */
    public getRuins(force?: boolean): Observable<Ruin[]> {
        return new Observable((sub: Subscriber<Ruin[]>) => {
            const saved_ruins: Ruin[] = getRuinsWithExpirationDate();
            if (saved_ruins && saved_ruins.length > 0 && !force) {
                sub.next(saved_ruins);
            } else {
                super.get<RuinDTO[]>(this.API_URL + '/Fetcher/ruins')
                    .subscribe({
                        next: (response: HttpResponse<RuinDTO[]>) => {
                            const ruins: Ruin[] = dtoToModelArray(Ruin, response.body).sort((a: Ruin, b: Ruin) => {
                                if (a.label[this.locale].localeCompare(b.label[this.locale]) < 0) {
                                    return -1;
                                }
                                if (a.label[this.locale].localeCompare(b.label[this.locale]) > 0) {
                                    return 1;
                                }
                                return 0;
                            });
                            setRuinsWithExpirationDate(ruins);

                            sub.next(ruins);
                        },
                        error: (error: HttpErrorResponse) => {
                            sub.error(error);
                        }
                    });
            }
        });
    }

    /**
     * Récupère la liste des pouvoirs héro
     *
     * @returns {Observable<HeroSkill[]>}
     */
    public getHeroSkill(): Observable<HeroSkill[]> {
        return new Observable((sub: Subscriber<HeroSkill[]>) => {
            super.get<HeroSkillDTO[]>(this.API_URL + '/Fetcher/heroSkills')
                .subscribe({
                    next: (response: HttpResponse<HeroSkillDTO[]>) => {
                        const skills: HeroSkill[] = dtoToModelArray(HeroSkill, response.body).sort((a: HeroSkill, b: HeroSkill) => {
                            if (a.days_needed < b.days_needed) {
                                return -1;
                            }
                            if (a.days_needed > b.days_needed) {
                                return 1;
                            }
                            return 0;
                        });
                        sub.next(skills);
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Récupère la liste des recettes
     *
     * @returns {Observable<Recipe[]>}
     */
    public getRecipes(): Observable<Recipe[]> {
        return new Observable((sub: Subscriber<Recipe[]>) => {
            super.get<RecipeDTO[]>(this.API_URL + '/Fetcher/recipes')
                .subscribe({
                    next: (response: HttpResponse<RecipeDTO[]>) => {
                        sub.next(dtoToModelArray(Recipe, response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }
}

