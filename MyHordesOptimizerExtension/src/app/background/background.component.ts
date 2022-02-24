import { browser, Tabs } from 'webextension-polyfill-ts';
import { Component, OnInit } from '@angular/core';

/**
 * Les actions principales de l'extension
 */
@Component({
    selector: 'mho-background',
    template: ''
})
export class BackgroundComponent implements OnInit {


    ngOnInit(): void {

        console.log('document', document);
        document.body.style.border = "10px solid red";
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
            browser.tabs.executeScript(
              tabs[0].id!,
              { code: `document.body.style.border = 10px solid red` }
            );
          });
        browser.tabs.getCurrent().then((test) => {
            console.log('test', test);
        })
    }

}
