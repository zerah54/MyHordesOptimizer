import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import type { MockedObject } from 'vitest';

import { PreTownService } from '../../_abstract_model/services/pre-town.service';
import { PreTown, PreTownSummary } from '../../_abstract_model/types/pre-town.class';
import { PreTownListComponent } from './pre-town-list.component';

interface TestableComponent {
    alias: { set(value: string): void };
    create(): void;
    open(item: PreTownSummary): void;
}

function summary(id: number, seen: boolean, isLinked: boolean = false): PreTownSummary {
    return { preTownId: id, mapId: 1_000_000_000 + id, alias: `PV${id}`, isOrganizer: true, seen, isLinked, memberCount: 3 };
}

describe('PreTownListComponent', (): void => {
    let fixture: ComponentFixture<PreTownListComponent>;
    let service: MockedObject<PreTownService>;
    let router: Router;

    beforeEach(async (): Promise<void> => {
        service = {
            listMine: vi.fn().mockName('PreTownService.listMine'),
            create: vi.fn().mockName('PreTownService.create')
        } as unknown as MockedObject<PreTownService>;
        service.listMine.mockReturnValue(of([summary(1, false), summary(2, true, true)]));
        await TestBed.configureTestingModule({
            imports: [PreTownListComponent],
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([]), { provide: PreTownService, useValue: service }]
        }).compileComponents();
        router = TestBed.inject(Router);
        vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture = TestBed.createComponent(PreTownListComponent);
        fixture.detectChanges();
    });

    function element(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    it('affiche le badge « nouveau » seulement pour seen === false', (): void => {
        const rows: HTMLElement[] = Array.from(element().querySelectorAll<HTMLElement>('.pre-town-row'));
        expect(rows.length).toBe(2);
        expect(rows[0].querySelector('.new-badge')).not.toBeNull();
        expect(rows[1].querySelector('.new-badge')).toBeNull();
    });

    it('affiche l\'indicateur « liée » seulement pour une pré-ville liée', (): void => {
        const rows: HTMLElement[] = Array.from(element().querySelectorAll<HTMLElement>('.pre-town-row'));
        expect(rows[0].querySelector('.linked-badge')).toBeNull();
        expect(rows[1].querySelector('.linked-badge')).not.toBeNull();
    });

    it('le badge disparaît à l\'ouverture et la navigation part vers le détail', (): void => {
        (fixture.componentInstance as unknown as TestableComponent).open(summary(1, false));
        fixture.detectChanges();
        expect(element().querySelector('.new-badge')).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/pre-town', 1]);
    });

    it('le bouton créer est désactivé tant que l\'alias est vide', (): void => {
        const button: HTMLButtonElement = element().querySelector<HTMLButtonElement>('.create-button') as HTMLButtonElement;
        expect(button.disabled).toBe(true);
        (fixture.componentInstance as unknown as TestableComponent).alias.set('Nouvelle');
        fixture.detectChanges();
        expect(button.disabled).toBe(false);
    });

    it('créer appelle le service avec l\'alias nettoyé puis ouvre la pré-ville', (): void => {
        const created: PreTown = { preTownId: 9 } as PreTown;
        service.create.mockReturnValue(of(created));
        const component: TestableComponent = fixture.componentInstance as unknown as TestableComponent;
        component.alias.set('  Nouvelle ');
        component.create();
        expect(service.create).toHaveBeenCalledWith('Nouvelle');
        expect(router.navigate).toHaveBeenCalledWith(['/pre-town', 9]);
    });
    describe('chargement de la liste', (): void => {
        async function createWith(list: Subject<PreTownSummary[]> | null, error: boolean = false): Promise<void> {
            if (error) {
                service.listMine.mockReturnValue(throwError((): Error => new Error('boom')));
            } else if (list !== null) {
                service.listMine.mockReturnValue(list.asObservable());
            }
            fixture = TestBed.createComponent(PreTownListComponent);
            fixture.detectChanges();
        }

        it('affiche un spinner tant que la liste charge', async (): Promise<void> => {
            await createWith(new Subject<PreTownSummary[]>());
            expect(element().querySelector('.list-loading mat-spinner')).not.toBeNull();
        });

        it('retire le spinner et affiche un état vide explicite si aucune pré-ville', async (): Promise<void> => {
            const list: Subject<PreTownSummary[]> = new Subject<PreTownSummary[]>();
            await createWith(list);
            list.next([]);
            fixture.detectChanges();
            expect(element().querySelector('.list-loading')).toBeNull();
            expect(element().querySelector('.list-empty')).not.toBeNull();
        });

        it("sur erreur, retire le spinner et affiche un message d'erreur", async (): Promise<void> => {
            await createWith(null, true);
            expect(element().querySelector('.list-loading')).toBeNull();
            expect(element().querySelector('.list-error')).not.toBeNull();
        });
    });
});
