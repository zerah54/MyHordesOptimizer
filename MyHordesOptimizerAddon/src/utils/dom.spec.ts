import { describe, expect, it } from 'vitest';

import { ensureDashedSeparatorAfter } from './dom';

describe('ensureDashedSeparatorAfter', () => {
    it('creates a dashed hr right after the anchor when none exists', () => {
        document.body.innerHTML = '<div id="root"><span id="anchor"></span><span id="rest"></span></div>';
        const anchor: Element = document.getElementById('anchor') as Element;

        const separator: Element = ensureDashedSeparatorAfter(anchor);

        expect(separator.tagName).toBe('HR');
        expect(separator.classList.contains('dashed')).toBe(true);
        expect(anchor.nextElementSibling).toBe(separator);
        expect(separator.nextElementSibling?.id).toBe('rest');
    });

    it('reuses the existing dashed hr instead of adding a second one', () => {
        document.body.innerHTML = '<div id="root"><span id="anchor"></span><hr class="dashed" id="existing"><span id="rest"></span></div>';
        const anchor: Element = document.getElementById('anchor') as Element;
        const existing: Element = document.getElementById('existing') as Element;

        const separator: Element = ensureDashedSeparatorAfter(anchor);

        expect(separator).toBe(existing);
        expect(document.querySelectorAll('hr.dashed').length).toBe(1);
    });

    it('returns the anchor itself when it is already a dashed hr, without creating another one', () => {
        document.body.innerHTML = '<div id="root"><hr class="dashed" id="anchor"><span id="rest"></span></div>';
        const anchor: Element = document.getElementById('anchor') as Element;

        const separator: Element = ensureDashedSeparatorAfter(anchor);

        expect(separator).toBe(anchor);
        expect(document.querySelectorAll('hr.dashed').length).toBe(1);
    });
});
