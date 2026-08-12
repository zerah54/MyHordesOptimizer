import { describe, expect, it } from 'vitest';

describe('innerText probe', () => {
    it('checks jsdom innerText behavior with a hidden tooltip child (no external CSS)', () => {
        document.body.innerHTML = '<div class="citizen-box location">' +
            '<div class="tooltip normal"><em>Truhe</em></div>' +
            'Oui' +
            '</div>';
        const el = document.querySelector('.citizen-box.location') as HTMLElement;

        console.log('innerText=[' + el.innerText + ']');
        console.log('textContent=[' + el.textContent + ']');
        expect(true).toBe(true);
    });

    it('checks with display:none inline style on tooltip', () => {
        document.body.innerHTML = '<div class="citizen-box location">' +
            '<div class="tooltip normal" style="display:none"><em>Truhe</em></div>' +
            'Oui' +
            '</div>';
        const el = document.querySelector('.citizen-box.location') as HTMLElement;
        console.log('innerText(display:none)=[' + el.innerText + ']');
    });
});
