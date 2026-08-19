import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TOWN_KEY } from '../../_abstract_model/const';
import { OverflowComponent, ScenarioResult } from './overflow.component';

describe('OverflowComponent', (): void => {
    let fixture: ComponentFixture<OverflowComponent>;
    let component: OverflowComponent;

    beforeEach((): void => {
        localStorage.removeItem(TOWN_KEY);
        TestBed.configureTestingModule({
            imports: [OverflowComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        fixture = TestBed.createComponent(OverflowComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('cocher "Ville en chaos" met à jour le facteur de zombies actifs dès le premier clic', (): void => {
        const checkbox: HTMLInputElement = fixture.debugElement
            .query(By.css('mat-checkbox input[type=checkbox]')).nativeElement;

        expect(component['activeZombiesTooltip']()).toContain('45%');
        expect(component['activeZombiesTooltip']()).toContain('55%');

        checkbox.click();
        fixture.detectChanges();

        expect(component['activeZombiesTooltip']()).toContain('55%');
        expect(component['activeZombiesTooltip']()).toContain('65%');
    });

    it('basculer la porte sur "Ouverte (< 30 min)" ignore la défense de ville dès le premier clic', (): void => {
        const door_group: DebugElement = fixture.debugElement.queryAll(By.css('mat-button-toggle-group'))[0];
        const open_toggle_button: HTMLButtonElement = door_group.queryAll(By.css('mat-button-toggle'))[1]
            .query(By.css('button')).nativeElement;
        const overflow_cell = (): string | null =>
            fixture.debugElement.query(By.css('table.chain .key td')).nativeElement.textContent;

        expect(overflow_cell()?.trim()).toBe('200');

        open_toggle_button.click();
        fixture.detectChanges();

        expect(overflow_cell()?.trim()).toBe('500');
    });

    it('cocher "Ville dévastée" verrouille et coche "Ville en chaos", et force la porte ouverte dans le facteur (dès le premier clic)', (): void => {
        const checkboxes: HTMLInputElement[] = fixture.debugElement
            .queryAll(By.css('mat-checkbox input[type=checkbox]')).map((el: DebugElement) => el.nativeElement);
        const [chaos_input, devastated_input]: HTMLInputElement[] = checkboxes;

        devastated_input.click();
        fixture.detectChanges();

        expect(component['chaos']).toBeTrue();
        expect(chaos_input.disabled).toBeTrue();
        // Porte fermée à l'écran, mais dévastée force +25 (ouverte ≥30 min) : (45+25)*1+20=90, (55+25)*1+20=100
        expect(component['activeZombiesTooltip']()).toContain('90%');
        expect(component['activeZombiesTooltip']()).toContain('100%');
    });

    it('le facteur réaliste est tiré comme un entier 45-55 (mt_rand), jamais une valeur fractionnaire', (): void => {
        spyOn(Math, 'random').and.returnValue(0.999999);

        expect(component['drawFactorBase']()).toBe(55);

        (<jasmine.Spy>Math.random).and.returnValue(0);

        expect(component['drawFactorBase']()).toBe(45);
    });

    it('affiche la fourchette du nombre de zombies actifs sous le facteur', (): void => {
        component['town_defense'] = 0;
        component['compute']();
        fixture.detectChanges();

        const zombie_count_cell: string = fixture.debugElement
            .queryAll(By.css('table.summary'))[1].queryAll(By.css('td'))[0].nativeElement.textContent;

        expect(zombie_count_cell).toContain('225');
        expect(zombie_count_cell).toContain('275');
    });

    it('l\'infobulle des zombies actifs donne le facteur (% de l\'attaque) et le % du débordement réellement servi', (): void => {
        component['attack'] = 1000;
        component['town_defense'] = 300;
        component['watch_defense'] = 0;
        component['door_state'] = 'closed';
        component['compute']();

        const tooltip: string = component['activeZombiesTooltip']();

        expect(tooltip).toContain('45%');
        expect(tooltip).toContain('55%');
        expect(tooltip).toContain('64.3%');
        expect(tooltip).toContain('78.6%');
    });

    it('débordement plafonné : bounds_saturated est vrai et les fourchettes favorable/défavorable sont masquées (réaliste seul, pas de "hors bornes")', (): void => {
        component['attack'] = 100000;
        component['town_defense'] = 99900;
        component['watch_defense'] = 0;
        component['door_state'] = 'closed';
        component['iterations'] = 200;
        component['compute']();
        fixture.detectChanges();

        expect(component['active_zombies_min']).toBe(component['active_zombies_max']);
        expect(component['bounds_saturated']).toBeTrue();

        const attacking_cell: string = fixture.debugElement
            .queryAll(By.css('table.summary'))[2].queryAll(By.css('td'))[0].nativeElement.textContent;
        expect(attacking_cell).not.toContain('(');
    });

    it('débordement non plafonné : bounds_saturated est faux et la fourchette favorable/défavorable reste affichée', (): void => {
        component['town_defense'] = 0;
        component['iterations'] = 200;
        component['compute']();
        fixture.detectChanges();

        expect(component['active_zombies_min']).toBeLessThan(component['active_zombies_max']);
        expect(component['bounds_saturated']).toBeFalse();

        const attacking_cell: string = fixture.debugElement
            .queryAll(By.css('table.summary'))[2].queryAll(By.css('td'))[0].nativeElement.textContent;
        expect(attacking_cell).toContain('(');
    });

    it('défense par défaut à 0 : "au moins 1 mort" et "au moins 1 survivant" sont exclusifs (jamais les deux à 100%)', (): void => {
        component['home_defense'] = 0;
        component['iterations'] = 500;
        component['compute']();

        const scenario: ScenarioResult = component['scenarios'][0];
        expect(scenario.survivor_at_least_one).toBe(0);
    });

    it('défense par défaut énorme : personne ne meurt jamais (histogramme à 0 mort = 100%)', (): void => {
        component['home_defense'] = 999999;
        component['citizen_defenses'] = component['citizen_defenses']
            .map((row) => ({ ...row, defense: 999999 }));
        component['iterations'] = 500;
        component['compute']();

        const scenario: ScenarioResult = component['scenarios'][0];
        expect(scenario.death_histogram[0].probability).toBe(1);
        expect(scenario.death_histogram[0].at_least_probability).toBe(1);
    });

    it('dévastée force la porte ouverte même porte fermée sélectionnée : défense de ville ignorée', (): void => {
        component['door_state'] = 'closed';
        component['devastated'] = true;
        component['compute']();
        fixture.detectChanges();

        const overflow_cell: string = fixture.debugElement.query(By.css('table.chain .key td')).nativeElement.textContent;
        expect(overflow_cell.trim()).toBe('500');
    });

    it('dévastée ramène le niveau d\'habitation à 0 quel que soit house_counts', (): void => {
        component['house_counts'] = [0, 0, 0, 40, 0, 0, 0, 0, 0];
        component['devastated'] = false;
        component['compute']();
        expect(component['habitation_level']).toBe(3);

        component['devastated'] = true;
        component['compute']();
        expect(component['habitation_level']).toBe(0);
    });

    it('dévastée NE force PAS la défense personnelle à 0 : seule la part liée au logement l\'est, le reste (métier, objets) compte toujours', (): void => {
        component['nb_alive'] = 2;
        component['day'] = 1;
        component['iterations'] = 500;
        component['compute']();
        component['citizen_defenses'][0].defense = 999999;
        component['citizen_defenses'][1].defense = 999999;
        component['home_defense'] = 999999;
        component['devastated'] = true;

        component['compute']();

        const scenario: ScenarioResult = component['scenarios'][0];
        expect(scenario.citizens[0].death_probability).toBe(0);
        expect(scenario.citizens[1].death_probability).toBe(0);
    });

    it('histogramme des survivants : miroir exact de celui des morts (survivants = ciblés - morts)', (): void => {
        component['iterations'] = 500;
        component['compute']();

        const scenario: ScenarioResult = component['scenarios'][0];
        const n: number = scenario.death_histogram.length - 1;

        for (let k: number = 0; k <= n; k++) {
            const survivors: number = n - k;
            expect(scenario.survivor_histogram[survivors].probability).toBe(scenario.death_histogram[k].probability);
        }
    });

    it('favorable et défavorable sont toujours calculés à côté du réaliste, sans onglet à basculer', (): void => {
        component['iterations'] = 500;
        component['compute']();
        fixture.detectChanges();

        expect(component['favorable']).not.toBeNull();
        expect(component['defavorable']).not.toBeNull();
        expect(component['favorable']?.attacking).toBeLessThanOrEqual(component['defavorable']?.attacking ?? 0);
        expect(fixture.debugElement.queryAll(By.css('mat-button-toggle')).map((el: DebugElement) => el.nativeElement.textContent.trim()))
            .not.toContain('Favorable / défavorable');

        const attacking_cell: string = fixture.debugElement.queryAll(By.css('table.summary'))[2].nativeElement.textContent;
        expect(attacking_cell).toContain(String(component['favorable']?.attacking));
        expect(attacking_cell).toContain(String(component['defavorable']?.attacking));
    });

    it('la colonne "Zombies (moyenne)" du tableau par rang n\'affiche pas favorable/défavorable (redondant avec Min-Max)', (): void => {
        component['iterations'] = 500;
        component['compute']();
        fixture.detectChanges();

        const rank_table: DebugElement = fixture.debugElement.queryAll(By.css('table.ranks:not(.histogram)'))[0];
        const first_row: DebugElement = rank_table.queryAll(By.css('tbody tr'))[0];
        const mean_cell: string = first_row.queryAll(By.css('td'))[0].nativeElement.textContent;

        expect(mean_cell).not.toContain('(');
    });

    it('une valeur constante (min = max) n\'affiche qu\'un seul nombre, sans répéter la fourchette', (): void => {
        // Attaque très supérieure au débordement (100) : le facteur ne change plus rien, l'attaque
        // servie est toujours plafonnée à 100. Avec 1 seul citoyen ciblé, son résultat est déterministe.
        component['attack'] = 100000;
        component['town_defense'] = 99900;
        component['watch_defense'] = 0;
        component['door_state'] = 'closed';
        component['nb_alive'] = 1;
        component['day'] = 1;
        component['iterations'] = 200;
        component['compute']();
        fixture.detectChanges();

        const scenario: ScenarioResult = component['scenarios'][0];
        expect(scenario.ranks[0].min).toBe(scenario.ranks[0].max);
        expect(scenario.ranks[0].p5).toBe(scenario.ranks[0].p95);

        const rank_table: DebugElement = fixture.debugElement.queryAll(By.css('table.ranks:not(.histogram)'))[0];
        const cells: DebugElement[] = rank_table.queryAll(By.css('tbody tr'))[0].queryAll(By.css('td'));
        // Min-Max (index 1) et Fourchette (index 2) : une seule valeur, pas de tiret.
        expect(cells[1].nativeElement.textContent).not.toContain('–');
        expect(cells[2].nativeElement.textContent).not.toContain('–');
    });

    it('les cellules de données (td) ne sont pas en gras, y compris dans les lignes "key" et "dies"', (): void => {
        component['compute']();
        fixture.detectChanges();

        const key_td: HTMLElement = fixture.debugElement.query(By.css('table.chain tr.key td')).nativeElement;
        expect(getComputedStyle(key_td).fontWeight).not.toBe('700');
    });

    it('le toggle "Répartition finale" bascule l\'affichage entre morts et survivants', (): void => {
        const histogram_group: DebugElement = fixture.debugElement.queryAll(By.css('mat-button-toggle-group'))[1];
        const survivors_button: HTMLButtonElement = histogram_group.queryAll(By.css('mat-button-toggle'))[1]
            .query(By.css('button')).nativeElement;

        expect(fixture.debugElement.query(By.css('table.histogram thead th')).nativeElement.textContent.trim()).toBe('Morts');

        survivors_button.click();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('table.histogram thead th')).nativeElement.textContent.trim()).toBe('Survivants');
    });

    it('défense par citoyen : un citoyen à défense énorme ne meurt jamais, même si tous sont ciblés', (): void => {
        component['nb_alive'] = 2;
        component['day'] = 1;
        component['iterations'] = 500;
        component['compute']();

        component['citizen_defenses'][0].defense = 0;
        component['citizen_defenses'][1].defense = 999999;
        component['compute']();

        const scenario: ScenarioResult = component['scenarios'][0];
        expect(scenario.citizens[1].death_probability).toBe(0);
        expect(scenario.citizens[0].death_probability).toBeGreaterThan(0.5);
    });

    it('table "Par défense" : deux citoyens à la même défense sont regroupés, proba moyenne des deux', (): void => {
        component['nb_alive'] = 3;
        component['day'] = 1;
        component['iterations'] = 500;
        component['compute']();

        component['citizen_defenses'][0].defense = 10;
        component['citizen_defenses'][1].defense = 10;
        component['citizen_defenses'][2].defense = 999999;
        component['compute']();

        const scenario: ScenarioResult = component['scenarios'][0];
        expect(scenario.defense_groups.length).toBe(2);

        const shared: { defense: number; count: number } | undefined = scenario.defense_groups.find((g) => g.defense === 10);
        expect(shared?.count).toBe(2);
        const solo: { defense: number; count: number } | undefined = scenario.defense_groups.find((g) => g.defense === 999999);
        expect(solo?.count).toBe(1);
    });

    it('table "Par défense" : sans citoyens nommés (hors ville), le groupe n\'a aucun nom à proposer en infobulle', (): void => {
        component['iterations'] = 200;
        component['compute']();

        const scenario: ScenarioResult = component['scenarios'][0];
        expect(scenario.defense_groups.every((g) => g.names.length === 0)).toBeTrue();
    });

    it('table "Par défense" : en mode "Ma ville", le groupe liste les noms des citoyens qui le composent', (): void => {
        localStorage.setItem(TOWN_KEY, JSON.stringify({
            town_id: 1, town_x: 0, town_y: 0, town_max_x: 40, town_max_y: 40,
            is_chaos: false, is_devaste: false, day: 5, town_type: 'primary', has_external_api: null
        }));

        const town_fixture: ComponentFixture<OverflowComponent> = TestBed.createComponent(OverflowComponent);
        const town_component: OverflowComponent = town_fixture.componentInstance;
        town_fixture.detectChanges();

        const http_mock: HttpTestingController = TestBed.inject(HttpTestingController);

        const citizens_req: TestRequest = http_mock.expectOne((req) => req.url.includes('/Fetcher/citizens'));
        citizens_req.flush({
            citizens: {
                '1': { id: 1, name: 'Alice', dead: false, jobUid: null, houseDefense: 10, home: { content: {} } }
            },
            lastUpdateInfo: {}
        });
        const attack_req: TestRequest = http_mock.expectOne((req) => req.url.includes('/attaqueEstimation/AttackCalculation'));
        attack_req.flush(null, { status: 500, statusText: 'Server Error' });

        town_fixture.detectChanges();
        town_component['iterations'] = 200;
        town_component['compute']();

        const scenario: ScenarioResult = town_component['scenarios'][0];
        const group: { names: string[] } | undefined = scenario.defense_groups.find((g) => g.names.length > 0);
        expect(group?.names).toEqual(['Alice']);
    });

    it('en mode "Ma ville", préremplit la défense d\'un citoyen avec la valeur reconstruite (baseDef + renfort/clôture), pas seulement baseDef', (): void => {
        localStorage.setItem(TOWN_KEY, JSON.stringify({
            town_id: 1, town_x: 0, town_y: 0, town_max_x: 40, town_max_y: 40,
            is_chaos: false, is_devaste: false, day: 5, town_type: 'primary', has_external_api: null
        }));

        const town_fixture: ComponentFixture<OverflowComponent> = TestBed.createComponent(OverflowComponent);
        const town_component: OverflowComponent = town_fixture.componentInstance;
        town_fixture.detectChanges();

        const http_mock: HttpTestingController = TestBed.inject(HttpTestingController);

        // Citoyen héroïque (jobUid 'shield' = Gardien) avec un renfort de niveau 6 (<=6, donc +6 direct) et pas de clôture.
        const citizens_req: TestRequest = http_mock.expectOne((req) => req.url.includes('/Fetcher/citizens'));
        citizens_req.flush({
            citizens: {
                '1': {
                    id: 1,
                    name: 'Alice',
                    dead: false,
                    jobUid: 'shield',
                    houseDefense: 10,
                    home: { content: { renfortLevel: 6 } }
                }
            },
            lastUpdateInfo: {}
        });

        // Estimation d'attaque non pertinente ici : erreur volontaire, absorbée par le catchError(() => of(null)) du composant.
        const attack_req: TestRequest = http_mock.expectOne((req) => req.url.includes('/attaqueEstimation/AttackCalculation'));
        attack_req.flush(null, { status: 500, statusText: 'Server Error' });

        town_fixture.detectChanges();

        // 10 (houseDefense) + 3 (bonus héroïque Gardien : +2 métier +1) + 6 (renfort <=6, direct).
        expect(town_component['citizen_defenses'][0].defense).toBe(19);
    });
});
