import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenInfoComponent } from './citizen-info.component';

function newCitizen(overrides: Partial<Citizen>): Citizen {
    const citizen = new Citizen();
    citizen.id = 42;
    citizen.name = 'Bob';
    Object.assign(citizen, overrides);
    return citizen;
}

describe('CitizenInfoComponent', (): void => {
    let fixture: ComponentFixture<CitizenInfoComponent>;

    beforeEach(async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [CitizenInfoComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(CitizenInfoComponent);
    });

    it('shows the citizen name by default (simple pseudo mode)', (): void => {
        fixture.componentRef.setInput('citizen', newCitizen({}));
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent.trim()).toBe('Bob');
    });

    it('shows the citizen tag when displayPseudoMode is id_mh', (): void => {
        fixture.componentRef.setInput('citizen', newCitizen({}));
        fixture.componentRef.setInput('displayPseudoMode', 'id_mh');
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent.trim()).toBe('@Bob:42');
    });

    it('does not show the job icon by default even if the citizen has a job', (): void => {
        fixture.componentRef.setInput('citizen', newCitizen({ job: JobEnum.SCAVENGER }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('img').length).toBe(0);
    });

    it('shows the job icon when displayJob is true and the citizen has a job with an image', (): void => {
        fixture.componentRef.setInput('citizen', newCitizen({ job: JobEnum.SCAVENGER }));
        fixture.componentRef.setInput('displayJob', true);
        fixture.detectChanges();

        const img: HTMLImageElement | null = fixture.nativeElement.querySelector('img');
        expect(img).toBeTruthy();
        expect(img?.src).toContain(`${HORDES_IMG_REPO}professions/dig.gif`);
    });

    it('does not show the job icon when displayJob is true but the citizen has no job', (): void => {
        fixture.componentRef.setInput('citizen', newCitizen({ job: undefined }));
        fixture.componentRef.setInput('displayJob', true);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('img').length).toBe(0);
    });

    it('does not show the shun icon by default even if the citizen is shunned', (): void => {
        fixture.componentRef.setInput('citizen', newCitizen({ is_shunned: true }));
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('img').length).toBe(0);
    });

    it('shows the shun icon when displayShunStatus is true and the citizen is shunned', (): void => {
        fixture.componentRef.setInput('citizen', newCitizen({ is_shunned: true }));
        fixture.componentRef.setInput('displayShunStatus', true);
        fixture.detectChanges();

        const img: HTMLImageElement | null = fixture.nativeElement.querySelector('img');
        expect(img).toBeTruthy();
        expect(img?.src).toContain(`${HORDES_IMG_REPO}icons/banished.gif`);
    });

    it('does not show the shun icon when displayShunStatus is true but the citizen is not shunned', (): void => {
        fixture.componentRef.setInput('citizen', newCitizen({ is_shunned: false }));
        fixture.componentRef.setInput('displayShunStatus', true);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('img').length).toBe(0);
    });

    it('shows both job and shun icons together, on either side of the name', (): void => {
        fixture.componentRef.setInput('citizen', newCitizen({ job: JobEnum.SCAVENGER, is_shunned: true }));
        fixture.componentRef.setInput('displayJob', true);
        fixture.componentRef.setInput('displayShunStatus', true);
        fixture.detectChanges();

        const images: NodeListOf<HTMLImageElement> = fixture.nativeElement.querySelectorAll('img');
        expect(images.length).toBe(2);
        expect(images[0].src).toContain('professions/dig.gif');
        expect(images[1].src).toContain('icons/banished.gif');
        expect(fixture.nativeElement.textContent).toContain('Bob');
    });
});
