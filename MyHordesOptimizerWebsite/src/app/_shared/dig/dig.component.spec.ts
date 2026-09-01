import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { Dig } from '../../_abstract_model/types/dig.class';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { DigComponent } from './dig.component';

describe('DigComponent', () => {
    let fixture: ComponentFixture<DigComponent>;
    let component: DigComponent;
    let httpMock: HttpTestingController;

    function makeCitizen(id: number = 1, name: string = 'Bob'): Citizen {
        const citizen: Citizen = new Citizen();
        citizen.id = id;
        citizen.name = name;
        return citizen;
    }

    function makeDig(overrides: Partial<Dig> = {}): Dig {
        const dig: Dig = new Dig();
        dig.cell_id = 1;
        dig.digger_id = 1;
        dig.digger_name = 'Bob';
        dig.x = 3;
        dig.y = 4;
        dig.day = 1;
        dig.nb_success = 2;
        dig.nb_total_dig = 5;
        Object.assign(dig, overrides);
        return dig;
    }

    function setup(digsMode: 'creation' | 'update' | 'registry', dig: Dig | undefined, citizen: Citizen = makeCitizen()): void {
        fixture.componentRef.setInput('citizen', citizen);
        fixture.componentRef.setInput('day', 1);
        fixture.componentRef.setInput('digsMode', digsMode);
        fixture.componentRef.setInput('dig', dig);
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DigComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()]
        }).compileComponents();

        fixture = TestBed.createComponent(DigComponent);
        component = fixture.componentInstance;
        httpMock = TestBed.inject(HttpTestingController);
        // Le snackbar réel nécessite un provider d'animations non fourni ici — hors périmètre de ce composant.
        spyOn(TestBed.inject(SnackbarService), 'successSnackbar');
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('n\'affiche rien tant que le setTimeout (effet du setter dig) n\'a pas été vidangé', fakeAsync(() => {
        setup('update', makeDig());
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.dig')).toBeNull();

        tick();
    }));

    it('mode update : affiche la position et le décompte de la fouille existante après vidange du setTimeout', fakeAsync(() => {
        setup('update', makeDig({ x: 7, y: 8, nb_success: 2, nb_total_dig: 5 }));
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const text: string = fixture.nativeElement.textContent;
        expect(text).toContain('7/8');
        expect(text).toContain('2');
        expect(text).toContain('5');
        expect(fixture.nativeElement.querySelector('.values input')).toBeNull();
    }));

    it('mode registry : préremplit updated_dig avec la fouille reçue, sans clic', fakeAsync(() => {
        setup('registry', makeDig({ x: 1, y: 2 }));
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        tick(); // vidange la microtâche interne de NgModel qui pousse la valeur vers le DOM

        const inputs: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll('.positions input');
        expect(inputs.length).toBe(2);
        expect(inputs[0].value).toBe('1');
        expect(inputs[1].value).toBe('2');
    }));

    it('mode creation sans fouille : affiche le bouton d\'ajout, puis bascule vers le formulaire après clic', fakeAsync(() => {
        setup('creation', undefined);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.values')).toBeNull();
        const add_button: HTMLButtonElement = fixture.nativeElement.querySelector('.positions ~ button, .dig > button');
        expect(add_button).toBeTruthy();

        add_button.click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.values')).toBeTruthy();
    }));

    it('changeDigToUpdate sans fouille construit une nouvelle fouille à partir du citoyen/jour courants', fakeAsync(() => {
        const citizen: Citizen = makeCitizen(42, 'Alice');
        setup('creation', undefined, citizen);
        fixture.detectChanges();
        tick();

        (component as unknown as { changeDigToUpdate(citizen: Citizen, dig?: Dig): void }).changeDigToUpdate(citizen);
        fixture.detectChanges();
        tick(); // vidange la microtâche interne de NgModel qui pousse la valeur vers le DOM

        const inputs: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll('.values input');
        expect(inputs[0].value).toBe('0');
        expect(inputs[1].value).toBe('0');
    }));

    it('le bouton d\'annulation vide updated_dig hors mode registry', fakeAsync(() => {
        setup('update', makeDig());
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        (component as unknown as { changeDigToUpdate(citizen: Citizen, dig?: Dig): void })
            .changeDigToUpdate(component.citizen(), makeDig());
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.values')).toBeTruthy();

        const cancel_button: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.actions button')[1];
        cancel_button.click();
        fixture.detectChanges();

        // En mode 'update', vider updated_dig fait retomber sur la variante lecture seule (elle aussi
        // dans un <div class="values">) : seule la disparition des <input> distingue les deux états.
        expect(fixture.nativeElement.querySelector('.values input')).toBeNull();
    }));

    it('updateDig envoie la fouille modifiée, émet updatedDig et vide updated_dig (mode update)', fakeAsync(() => {
        setup('update', makeDig());
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        (component as unknown as { changeDigToUpdate(citizen: Citizen, dig?: Dig): void })
            .changeDigToUpdate(component.citizen(), makeDig());
        fixture.detectChanges();

        const emitted: Dig[][] = [];
        component.updatedDig.subscribe((digs: Dig[]) => emitted.push(digs));

        const save_button: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.actions button')[0];
        save_button.click();

        const req: TestRequest = httpMock.expectOne((r: HttpRequest<unknown>) => r.urlWithParams.startsWith(`${environment.api_url}/Fetcher/MapDigs`) && r.method === 'POST');
        req.flush([]);
        fixture.detectChanges();

        expect(emitted.length).toBe(1);
        expect(fixture.nativeElement.querySelector('.values input')).toBeNull();
    }));

    it('updateDig conserve updated_dig en mode registry après enregistrement', fakeAsync(() => {
        setup('registry', makeDig());
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const save_button: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.actions button')[0];
        save_button.click();

        const req: TestRequest = httpMock.expectOne((r: HttpRequest<unknown>) => r.urlWithParams.startsWith(`${environment.api_url}/Fetcher/MapDigs`) && r.method === 'POST');
        req.flush([]);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.values')).toBeTruthy();
    }));

    it('deleteDig, après confirmation, envoie la suppression et émet deletedDig', fakeAsync(() => {
        const dig: Dig = makeDig();
        setup('update', dig);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const dialog: MatDialog = TestBed.inject(MatDialog);
        spyOn(dialog, 'open').and.returnValue({ afterClosed: (): Observable<boolean> => of(true) } as unknown as MatDialogRef<unknown>);

        const emitted: Dig[] = [];
        component.deletedDig.subscribe((d: Dig) => emitted.push(d));

        const delete_button: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.actions button')[1];
        delete_button.click();

        const req: TestRequest = httpMock.expectOne((r: HttpRequest<unknown>) => r.urlWithParams.startsWith(`${environment.api_url}/Fetcher/MapDigs`) && r.method === 'DELETE');
        req.flush(null);

        expect(emitted.length).toBe(1);
        expect(emitted[0]).toBe(dig);
    }));

    it('deleteDig n\'envoie rien si la confirmation est refusée', fakeAsync(() => {
        setup('update', makeDig());
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const dialog: MatDialog = TestBed.inject(MatDialog);
        spyOn(dialog, 'open').and.returnValue({ afterClosed: (): Observable<boolean> => of(false) } as unknown as MatDialogRef<unknown>);

        const emitted: Dig[] = [];
        component.deletedDig.subscribe((d: Dig) => emitted.push(d));

        const delete_button: HTMLButtonElement = fixture.nativeElement.querySelectorAll('.actions button')[1];
        delete_button.click();

        httpMock.expectNone((r: HttpRequest<unknown>) => r.urlWithParams.startsWith(`${environment.api_url}/Fetcher/MapDigs`) && r.method === 'DELETE');
        expect(emitted.length).toBe(0);
    }));
});
