import { AfterViewInit, Component } from '@angular/core';

@Component({
    selector: 'mho-page-with-sidenav',
    template: ''
})
export class PageWithSidenav implements AfterViewInit {

    public ngAfterViewInit(): void {
        window.dispatchEvent(new Event('resize'));
    }
}

