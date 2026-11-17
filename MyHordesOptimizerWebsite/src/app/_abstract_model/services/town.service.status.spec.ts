import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { setTown } from '../../_core/utilities/localstorage.util';

import { StatusDTO } from '../dto/status.dto';
import { StatusEnum } from '../enum/status.enum';
import { Citizen } from '../types/citizen.class';
import { Status } from '../types/status.class';
import { UpdateInfo } from '../types/update-info.class';
import { TownService } from './town.service';

describe('TownService — updateStatus et goule', (): void => {
    let service: TownService;
    let http_mock: HttpTestingController;

    beforeEach((): void => {
        setTown(null);
        TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
        service = TestBed.inject(TownService);
        http_mock = TestBed.inject(HttpTestingController);
    });

    afterEach((): void => {
        http_mock.verify();
    });

    function citizenWith(icons: StatusEnum[], is_ghoul: boolean): Citizen {
        const status: Status = new Status({ icons: [], isGhoul: is_ghoul } as unknown as StatusDTO);
        status.icons = icons;
        status.update_info = new UpdateInfo();
        return Object.assign(new Citizen(), { id: 7, status });
    }

    const isStatus = (candidate: { url: string }): boolean => candidate.url.includes('/ExternalTools/Status');
    const isGhoul = (candidate: { url: string }): boolean => candidate.url.includes('/ExternalTools/Ghoul');

    it('la goule n\'est jamais envoyée avec la liste des états (l\'addon et la mise à jour des états ne l\'écrasent pas)', (): void => {
        const citizen: Citizen = citizenWith([StatusEnum.CLEAN, StatusEnum.GHOUL], true);

        service.updateStatus(citizen).subscribe();

        const request: TestRequest = http_mock.expectOne(isStatus);
        expect(JSON.parse(request.request.body as string)).toEqual({ userId: 7, status: ['clean'] });
        request.flush({});
        http_mock.expectNone(isGhoul);
    });

    it('ajouter « Goule » à la liste : écrite à part, par la saisie manuelle', (): void => {
        const citizen: Citizen = citizenWith([StatusEnum.GHOUL], false);

        service.updateStatus(citizen).subscribe();
        http_mock.expectOne(isStatus).flush({});
        const ghoul: TestRequest = http_mock.expectOne(isGhoul);

        expect(JSON.parse(ghoul.request.body as string)).toEqual({ userId: 7, isGhoul: true });
        ghoul.flush({});
        expect(citizen.status?.is_ghoul).toBe(true);
    });

    it('retirer « Goule » de la liste : goule retirée', (): void => {
        const citizen: Citizen = citizenWith([], true);

        service.updateStatus(citizen).subscribe();
        http_mock.expectOne(isStatus).flush({});
        const ghoul: TestRequest = http_mock.expectOne(isGhoul);

        expect(JSON.parse(ghoul.request.body as string)).toEqual({ userId: 7, isGhoul: false });
        ghoul.flush({});
        expect(citizen.status?.is_ghoul).toBe(false);
    });
});

describe('Status — goule dans la liste des états', (): void => {
    it('isGhoul du serveur : « Goule » figure dans les états, une seule fois', (): void => {
        const status: Status = new Status({ icons: ['clean', 'ghoul'], isGhoul: true } as unknown as StatusDTO);

        expect(status.icons.map((icon: StatusEnum): string => icon.key)).toEqual(['clean', 'ghoul']);
        expect(status.is_ghoul).toBe(true);
    });

    it('non goule : aucune « Goule » dans les états', (): void => {
        const status: Status = new Status({ icons: ['clean', 'ghoul'], isGhoul: false } as unknown as StatusDTO);

        expect(status.icons.map((icon: StatusEnum): string => icon.key)).toEqual(['clean']);
    });

    it('goule sans icône du serveur : ajoutée aux états', (): void => {
        const status: Status = new Status({ icons: [], isGhoul: true } as unknown as StatusDTO);

        expect(status.icons.map((icon: StatusEnum): string => icon.key)).toEqual(['ghoul']);
    });
});
