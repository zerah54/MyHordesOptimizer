import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'mho-content-script',
    template: ''
})
export class ContentScriptComponent implements OnInit {

    ngOnInit() {
        console.log('ceci est un test');
        document.body.style.border = '10px solid red';
    }
}
