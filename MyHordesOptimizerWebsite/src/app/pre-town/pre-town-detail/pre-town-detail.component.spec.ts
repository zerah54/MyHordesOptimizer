import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, delay, Observable, of, Subject, throwError } from 'rxjs';
import type { MockedObject } from 'vitest';

import { PreTownService } from '../../_abstract_model/services/pre-town.service';
import { UserAccountService } from '../../_abstract_model/services/user-account.service';
import { CitizenListPageResult } from '../../_abstract_model/types/citizen-list-item.model';
import { Me } from '../../_abstract_model/types/me.class';
import { PreTown, PreTownLinkPreview } from '../../_abstract_model/types/pre-town.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { TownContextService } from '../../_core/services/town-context.service';
import { setUser } from '../../_core/utilities/localstorage.util';
import { PreTownDetailComponent } from './pre-town-detail.component';

function preTown(isOrganizer: boolean, id: number = 5): PreTown {
    return {
        preTownId: id, mapId: 1_000_000_000 + id, alias: `PV${id}`, isOrganizer, isLinked: false, linkedMapId: null, linkedAt: null, canUnlink: false, simulatedCitizens: 40,
        members: [{ idUser: 42, name: 'Moi', isOrganizer }, { idUser: 7, name: 'Autre', isOrganizer: false }]
    };
}

describe('PreTownDetailComponent', (): void => {
    let service: MockedObject<PreTownService>;
    let directory: MockedObject<UserAccountService>;
    let router: Router;
    let params: BehaviorSubject<ParamMap>;
    let dialog: { open: ReturnType<typeof vi.fn> };
    let dialog_result: unknown;

    beforeEach((): void => {
        setUser(Object.assign(new Me(), { id: 42 }));
        service = {
            get: vi.fn().mockName('PreTownService.get'),
            markSeen: vi.fn().mockName('PreTownService.markSeen'),
            addMember: vi.fn().mockName('PreTownService.addMember'),
            removeMember: vi.fn().mockName('PreTownService.removeMember'),
            setOrganizer: vi.fn().mockName('PreTownService.setOrganizer'),
            rename: vi.fn().mockName('PreTownService.rename'),
            setSimulatedCitizens: vi.fn().mockName('PreTownService.setSimulatedCitizens'),
            previewLink: vi.fn().mockName('PreTownService.previewLink'),
            link: vi.fn().mockName('PreTownService.link'),
            unlink: vi.fn().mockName('PreTownService.unlink'),
            duplicate: vi.fn().mockName('PreTownService.duplicate')
        } as unknown as MockedObject<PreTownService>;
        service.markSeen.mockReturnValue(of(undefined));
        service.addMember.mockReturnValue(of(undefined));
        service.removeMember.mockReturnValue(of(undefined));
        service.setOrganizer.mockReturnValue(of(undefined));
        service.rename.mockReturnValue(of(undefined));
        service.setSimulatedCitizens.mockReturnValue(of(undefined));
        dialog_result = true;
        dialog = { open: vi.fn().mockImplementation((): { afterClosed: () => Observable<unknown> } => ({ afterClosed: (): Observable<unknown> => of(dialog_result) })) };
        directory = { getCitizensPaged: vi.fn().mockName('UserAccountService.getCitizensPaged') } as unknown as MockedObject<UserAccountService>;
        params = new BehaviorSubject<ParamMap>(convertToParamMap({ preTownId: '5' }));
    });

    afterEach((): void => setUser(null));

    async function create(get_result: Observable<PreTown> | ((id: number) => Observable<PreTown>)): Promise<ComponentFixture<PreTownDetailComponent>> {
        if (typeof get_result === 'function') {
            service.get.mockImplementation(get_result);
        } else {
            service.get.mockReturnValue(get_result);
        }
        await TestBed.configureTestingModule({
            imports: [PreTownDetailComponent],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([]),
                { provide: PreTownService, useValue: service },
                { provide: UserAccountService, useValue: directory },
                { provide: MatDialog, useValue: dialog },
                { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } }
            ]
        }).compileComponents();
        router = TestBed.inject(Router);
        vi.spyOn(router, 'navigate').mockResolvedValue(true);
        const fixture: ComponentFixture<PreTownDetailComponent> = TestBed.createComponent(PreTownDetailComponent);
        fixture.detectChanges();
        return fixture;
    }

    function el(fixture: ComponentFixture<PreTownDetailComponent>): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function click(fixture: ComponentFixture<PreTownDetailComponent>, selector: string): void {
        el(fixture).querySelector<HTMLButtonElement>(selector)?.click();
        fixture.detectChanges();
    }

    it('charge la pré-ville puis la marque comme vue', async (): Promise<void> => {
        await create(of(preTown(true)));
        expect(service.get).toHaveBeenCalledWith(5);
        expect(service.markSeen).toHaveBeenCalledWith(5);
    });

    it('un organisateur voit les contrôles de gestion', async (): Promise<void> => {
        const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
        expect(el(fixture).querySelector('.organizer-controls')).not.toBeNull();
        expect(el(fixture).querySelector('.member-search')).not.toBeNull();
        expect(el(fixture).querySelectorAll('.remove-member').length).toBe(1);
    });

    it('un non-organisateur ne voit que la liste et « Quitter »', async (): Promise<void> => {
        const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(false)));
        expect(el(fixture).querySelector('.organizer-controls')).toBeNull();
        expect(el(fixture).querySelector('.member-search')).toBeNull();
        expect(el(fixture).querySelector('.promote-member')).toBeNull();
        expect(el(fixture).querySelector('.remove-member')).toBeNull();
        expect(el(fixture).querySelector('.leave-button')).not.toBeNull();
    });

    it('erreur au chargement : retour à la liste, plus de spinner, markSeen jamais appelé', async (): Promise<void> => {
        const fixture: ComponentFixture<PreTownDetailComponent> = await create(throwError((): Error => new Error('403')).pipe(delay(0)));
        await fixture.whenStable();
        fixture.detectChanges();
        expect(router.navigate).toHaveBeenCalledWith(['/pre-town']);
        expect(el(fixture).querySelector('mat-spinner')).toBeNull();
        expect(service.markSeen).not.toHaveBeenCalled();
    });

    it('id non numérique : aucune requête, retour à la liste', async (): Promise<void> => {
        params.next(convertToParamMap({ preTownId: 'abc' }));
        await create(of(preTown(true)));
        expect(service.get).not.toHaveBeenCalled();
        expect(service.markSeen).not.toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/pre-town']);
    });

    it('changement d\'id dans l\'URL : recharge la nouvelle pré-ville', async (): Promise<void> => {
        await create(of(preTown(true)));
        service.get.mockReturnValue(of(preTown(true, 6)));
        params.next(convertToParamMap({ preTownId: '6' }));
        expect(service.get).toHaveBeenLastCalledWith(6);
        expect(service.markSeen).toHaveBeenLastCalledWith(6);
    });

    describe('recherche de joueurs (autocomplétion)', (): void => {
        const found: CitizenListPageResult = {
            items: [{ id: 99, name: 'Nouveau', nbTownsPlayed: 0 }, { id: 7, name: 'Autre', nbTownsPlayed: 0 }],
            totalCount: 2
        } as CitizenListPageResult;

        function options(): HTMLElement[] {
            return Array.from(document.querySelectorAll<HTMLElement>('mat-option'));
        }

        function type(fixture: ComponentFixture<PreTownDetailComponent>, term: string): HTMLInputElement {
            const input: HTMLInputElement = el(fixture).querySelector<HTMLInputElement>('.member-search input') as HTMLInputElement;
            input.focus();
            input.value = term;
            input.dispatchEvent(new Event('input'));
            vi.advanceTimersByTime(400);
            fixture.detectChanges();
            return input;
        }

        beforeEach((): void => {
            vi.useFakeTimers();
        });

        afterEach((): void => {
            vi.useRealTimers();
            document.querySelectorAll('.cdk-overlay-container').forEach((overlay: Element): void => overlay.replaceChildren());
        });

        it('la saisie déclenche la recherche après le délai, et les options listent les candidats hors membres', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            directory.getCitizensPaged.mockReturnValue(of(found));

            type(fixture, 'Nou');

            expect(directory.getCitizensPaged).toHaveBeenCalledWith({ page: 1, pageSize: 8, name: 'Nou' });
            expect(options().map((option: HTMLElement): string | undefined => option.textContent?.trim())).toEqual(['Nouveau']);
        });

        it('choisir une option appelle addMember, recharge, vide le champ et les résultats', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            directory.getCitizensPaged.mockReturnValue(of(found));
            const input: HTMLInputElement = type(fixture, 'Nou');
            await fixture.whenStable();

            options()[0].click();
            fixture.detectChanges();

            expect(service.addMember).toHaveBeenCalledWith(5, 99);
            expect(service.get).toHaveBeenCalledTimes(2);
            expect(input.value).toBe('');
            expect(options().length).toBe(0);
        });

        it('un ajout plus lent que le délai de recherche ne casse pas la recherche suivante', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            service.addMember.mockReturnValue(of(undefined).pipe(delay(500)));
            directory.getCitizensPaged.mockReturnValue(of(found));
            type(fixture, 'Nou');
            await fixture.whenStable();

            options()[0].click();
            vi.advanceTimersByTime(1000);
            fixture.detectChanges();
            type(fixture, 'Aut');

            expect(directory.getCitizensPaged).toHaveBeenLastCalledWith({ page: 1, pageSize: 8, name: 'Aut' });
            expect(options().length).toBe(1);
        });

        it('un ajout refusé laisse le champ vide et la recherche utilisable', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            service.addMember.mockReturnValue(throwError((): Error => new Error('403')));
            directory.getCitizensPaged.mockReturnValue(of(found));
            const input: HTMLInputElement = type(fixture, 'Nou');
            await fixture.whenStable();

            options()[0].click();
            vi.advanceTimersByTime(1000);
            fixture.detectChanges();

            expect(input.value).toBe('');
            expect(typeof (fixture.componentInstance as unknown as { search_control: { value: unknown } }).search_control.value).toBe('string');
            type(fixture, 'Aut');
            expect(options().length).toBe(1);
        });

        it('une recherche en erreur ne tue pas les recherches suivantes', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            directory.getCitizensPaged.mockReturnValueOnce(throwError((): Error => new Error('500'))).mockReturnValueOnce(of(found));

            type(fixture, 'No');
            type(fixture, 'Nou');

            expect(options().map((option: HTMLElement): string | undefined => option.textContent?.trim())).toEqual(['Nouveau']);
        });

        it('une réponse périmée est ignorée au profit de la dernière saisie', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            const slow: Subject<CitizenListPageResult> = new Subject<CitizenListPageResult>();
            directory.getCitizensPaged.mockReturnValueOnce(slow).mockReturnValueOnce(of(found));

            type(fixture, 'No');
            type(fixture, 'Nou');
            slow.next({ items: [{ id: 55, name: 'Perimé', nbTownsPlayed: 0 }], totalCount: 1 } as CitizenListPageResult);
            fixture.detectChanges();

            expect(options().map((option: HTMLElement): string | undefined => option.textContent?.trim())).toEqual(['Nouveau']);
        });
    });

    it('retirer un membre via le bouton appelle removeMember puis recharge', async (): Promise<void> => {
        const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
        click(fixture, '.remove-member');
        expect(service.removeMember).toHaveBeenCalledWith(5, 7);
        expect(service.get).toHaveBeenCalledTimes(2);
    });

    it('promouvoir un membre appelle setOrganizer', async (): Promise<void> => {
        const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
        click(fixture, '.promote-member');
        expect(service.setOrganizer).toHaveBeenCalledWith(5, 7, true);
    });

    it('quitter retire soi-même puis retourne à la liste', async (): Promise<void> => {
        const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(false)));
        click(fixture, '.leave-button');
        expect(service.removeMember).toHaveBeenCalledWith(5, 42);
        expect(router.navigate).toHaveBeenCalledWith(['/pre-town']);
    });

    it('renommer appelle rename avec l\'alias nettoyé', async (): Promise<void> => {
        const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
        const input: HTMLInputElement = el(fixture).querySelector<HTMLInputElement>('.organizer-controls input') as HTMLInputElement;
        input.value = '  Nouveau nom ';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        click(fixture, '.rename-button');
        expect(service.rename).toHaveBeenCalledWith(5, 'Nouveau nom');
    });

    describe('citoyens simulés', (): void => {
        function setCount(fixture: ComponentFixture<PreTownDetailComponent>, value: string): void {
            const input: HTMLInputElement = el(fixture).querySelector<HTMLInputElement>('.simulated-input') as HTMLInputElement;
            input.value = value;
            input.dispatchEvent(new Event('input'));
            fixture.detectChanges();
        }

        it('un organisateur règle le nombre', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            setCount(fixture, '25');
            click(fixture, '.simulated-button');
            expect(service.setSimulatedCitizens).toHaveBeenCalledWith(5, 25);
        });

        it('80 citoyens est accepté', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            setCount(fixture, '80');
            click(fixture, '.simulated-button');
            expect(service.setSimulatedCitizens).toHaveBeenCalledWith(5, 80);
        });

        it('hors de 1 à 80, aucun appel', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            for (const value of ['0', '81', '']) {
                setCount(fixture, value);
                click(fixture, '.simulated-button');
            }
            expect(service.setSimulatedCitizens).not.toHaveBeenCalled();
        });

        it('un membre ou une pré-ville liée : valeur affichée sans champ', async (): Promise<void> => {
            for (const pre_town of [preTown(false), { ...preTown(true), isLinked: true }]) {
                TestBed.resetTestingModule();
                const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(pre_town));
                expect(el(fixture).querySelector('.simulated-input')).toBeNull();
                expect(el(fixture).querySelector('.simulated-value')?.textContent).toContain('40');
            }
        });

        it('pose le nombre dans le contexte de pré-ville au chargement', async (): Promise<void> => {
            const loaded: Subject<PreTown> = new Subject<PreTown>();
            await create(loaded);
            const context: TownContextService = TestBed.inject(TownContextService);
            context.setPreTownEditable(true);
            loaded.next({ ...preTown(true), simulatedCitizens: 18 });

            expect(context.simulatedCitizens()).toBe(18);
            context.clear();
        });
    });

    describe('requêtes concurrentes', (): void => {
        let first: Subject<PreTown>;
        let second: Subject<PreTown>;

        async function openFiveThenSix(): Promise<ComponentFixture<PreTownDetailComponent>> {
            first = new Subject<PreTown>();
            second = new Subject<PreTown>();
            const fixture: ComponentFixture<PreTownDetailComponent> = await create((id: number): Observable<PreTown> => id === 5 ? first : second);
            params.next(convertToParamMap({ preTownId: '6' }));
            second.next(preTown(true, 6));
            second.complete();
            fixture.detectChanges();
            return fixture;
        }

        it(`une réponse tardive de l'ancien id n'écrase pas la nouvelle pré-ville et ne marque pas l'ancien id comme vu`, async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await openFiveThenSix();
            first.next(preTown(true, 5));
            first.complete();
            fixture.detectChanges();
            expect(el(fixture).querySelector('mat-card-title')?.textContent).toContain('PV6');
            expect(service.markSeen).toHaveBeenCalledTimes(1);
            expect(service.markSeen).toHaveBeenCalledWith(6);
        });

        it(`une erreur tardive de l'ancien id ne ramène pas à la liste`, async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await openFiveThenSix();
            first.error(new Error('403'));
            fixture.detectChanges();
            expect(router.navigate).not.toHaveBeenCalled();
            expect(el(fixture).querySelector('mat-card-title')?.textContent).toContain('PV6');
        });

        it('un rechargement après mutation annule le chargement en cours', async (): Promise<void> => {
            const slow: Subject<PreTown> = new Subject<PreTown>();
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            service.get.mockReturnValue(slow);
            click(fixture, '.remove-member');
            service.get.mockReturnValue(of(preTown(true)));
            click(fixture, '.remove-member');
            slow.next({ ...preTown(true), alias: 'OBSOLETE' });
            fixture.detectChanges();
            expect(el(fixture).querySelector('mat-card-title')?.textContent).toContain('PV5');
        });
    });

    describe('liaison, déliaison, duplication', (): void => {
        const PREVIEW: PreTownLinkPreview = { mapId: 77, townName: 'Ville réelle', added: 12, skipped: 3, skippedNotes: 2 };

        it('un membre simple ne voit ni « Lier », ni « Dupliquer »', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(false)));
            expect(el(fixture).querySelector('.link-button')).toBeNull();
            expect(el(fixture).querySelector('.duplicate-button')).toBeNull();
        });

        it("« Lier » : simule, affiche nom et comptes, et ne lie qu'après confirmation", async (): Promise<void> => {
            service.previewLink.mockReturnValue(of(PREVIEW));
            service.link.mockReturnValue(of({ added: 12, skipped: 3, skippedNotes: 2 }));
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            click(fixture, '.link-button');

            expect(service.previewLink).toHaveBeenCalledWith(5);
            const text: string = (dialog.open.mock.calls[0][1] as { data: { text: string } }).data.text;
            expect(text).toContain('Ville réelle');
            expect(text).toContain('12');
            expect(text).toContain('3');
            expect(service.link).toHaveBeenCalledWith(5);
            expect(service.get).toHaveBeenCalledTimes(2);
        });

        it("« Lier » refusé dans le dialogue : link n'est pas appelé", async (): Promise<void> => {
            dialog_result = false;
            service.previewLink.mockReturnValue(of(PREVIEW));
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            click(fixture, '.link-button');

            expect(service.link).not.toHaveBeenCalled();
        });

        it('pré-ville liée : plus de bouton « Lier »', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of({ ...preTown(true), isLinked: true }));
            expect(el(fixture).querySelector('.link-button')).toBeNull();
        });

        it('« Délier » absent quand canUnlink est faux', async (): Promise<void> => {
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of({ ...preTown(true), isLinked: true, canUnlink: false }));
            expect(el(fixture).querySelector('.unlink-button')).toBeNull();
        });

        it('« Délier » : confirmation puis unlink, puis rechargement', async (): Promise<void> => {
            service.unlink.mockReturnValue(of(undefined));
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of({ ...preTown(true), isLinked: true, canUnlink: true }));
            click(fixture, '.unlink-button');

            expect(dialog.open).toHaveBeenCalledTimes(1);
            expect(service.unlink).toHaveBeenCalledWith(5);
            expect(service.get).toHaveBeenCalledTimes(2);
        });

        it("« Délier » refusé : unlink n'est pas appelé", async (): Promise<void> => {
            dialog_result = false;
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of({ ...preTown(true), isLinked: true, canUnlink: true }));
            click(fixture, '.unlink-button');

            expect(service.unlink).not.toHaveBeenCalled();
        });

        it('« Dupliquer » : alias saisi, duplicate, puis navigation vers la copie', async (): Promise<void> => {
            dialog_result = 'Copie';
            service.duplicate.mockReturnValue(of(preTown(true, 9)));
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            click(fixture, '.duplicate-button');

            expect(service.duplicate).toHaveBeenCalledWith(5, 'Copie');
            expect(router.navigate).toHaveBeenCalledWith(['/pre-town', 9]);
        });

        it("« Dupliquer » : l'alias proposé ne dépasse jamais 64 caractères", async (): Promise<void> => {
            dialog_result = undefined;
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of({ ...preTown(true), alias: 'A'.repeat(64) }));
            click(fixture, '.duplicate-button');

            const proposed: string = (dialog.open.mock.calls[0][1] as { data: { alias: string } }).data.alias;
            expect(proposed.length).toBeLessThanOrEqual(64);
            expect(proposed.startsWith('AAAA')).toBe(true);
        });

        it("« Dupliquer » annulé : rien n'est créé", async (): Promise<void> => {
            dialog_result = undefined;
            const fixture: ComponentFixture<PreTownDetailComponent> = await create(of(preTown(true)));
            click(fixture, '.duplicate-button');

            expect(service.duplicate).not.toHaveBeenCalled();
        });

        it('met à jour le contexte de pré-ville : gel quand la pré-ville est liée', async (): Promise<void> => {
            const loaded: Subject<PreTown> = new Subject<PreTown>();
            await create(loaded);
            const context: TownContextService = TestBed.inject(TownContextService);
            context.setObservedTown(Object.assign(new TownDetails(), { town_id: 1_000_000_005 }), 'PV5');
            context.setPreTownEditable(true);
            loaded.next({ ...preTown(true), isLinked: true });

            expect(context.isReadonly()).toBe(true);
            context.clear();
        });
    });
});
