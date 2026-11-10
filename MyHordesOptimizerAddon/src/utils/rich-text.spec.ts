import { describe, expect, it } from 'vitest';

import { appendRichText } from './rich-text';

function render(html: string | null): HTMLDivElement {
    const container: HTMLDivElement = document.createElement('div');
    appendRichText(container, html);
    return container;
}

describe('appendRichText', (): void => {
    it('garde la mise en forme de l\'éditeur des consignes', (): void => {
        expect(render('<p>Prendre <strong>2</strong> <em>planches</em></p><ul><li>eau</li></ul>').innerHTML)
            .toBe('<p>Prendre <strong>2</strong> <em>planches</em></p><ul><li>eau</li></ul>');
    });

    it('retire scripts, gestionnaires d\'évènements et attributs', (): void => {
        const container: HTMLDivElement = render('<p onclick="alert(1)" class="x">a<script>alert(2)</script><img src="x" onerror="alert(3)"></p>');
        expect(container.innerHTML).toBe('<p>a</p>');
    });

    it('ne garde que les liens et images http(s), liens ouverts dans un nouvel onglet', (): void => {
        const container: HTMLDivElement = render('<a href="javascript:alert(1)">piège</a> <a href="https://myhordes.fr">jeu</a>');
        expect(container.querySelectorAll('a')).toHaveLength(1);
        const link: HTMLAnchorElement = container.querySelector('a');
        expect(link.getAttribute('href')).toBe('https://myhordes.fr');
        expect(link.target).toBe('_blank');
        expect(link.rel).toBe('noopener noreferrer');
        expect(container.textContent).toBe('piège jeu');
    });

    it('déroule les balises inconnues sans perdre leur texte', (): void => {
        expect(render('<custom-tag>texte <b>gras</b></custom-tag>').innerHTML).toBe('texte <b>gras</b>');
    });

    it('ne garde que les styles de couleur, d\'alignement et de taille bien formés', (): void => {
        const span: HTMLSpanElement = render('<span style="color: #ff0000; position: fixed; background-color: url(x)">rouge</span>').querySelector('span');
        expect(span.getAttribute('style')).toBe('color: rgb(255, 0, 0);');
    });

    it('affiche les cases des listes de tâches sans les rendre modifiables', (): void => {
        const checkbox: HTMLInputElement = render('<label><input type="checkbox" checked></label>').querySelector('input');
        expect(checkbox.checked).toBe(true);
        expect(checkbox.disabled).toBe(true);
    });

    it('ne fait rien sans texte', (): void => {
        expect(render(null).childNodes).toHaveLength(0);
    });
});
