import { TutorialPage } from './tutorial.model';
import { htmlToForum, tutorialToForum } from './tutorial-forum.util';

describe('tutorial forum format', (): void => {
    it('converts links whatever the attribute order', (): void => {
        expect(htmlToForum('Voir la <a href="https://a.b/c" target="_blank" rel="noopener">page</a>.')).toBe('Voir la [link=https://a.b/c]page[/link].');
        expect(htmlToForum('<a target="_blank" href="https://a.b">x</a> et <a href="https://c.d">y</a>')).toBe('[link=https://a.b]x[/link] et [link=https://c.d]y[/link]');
    });

    it('converts emphasis, lists, paragraphs and line breaks', (): void => {
        const html: string = `<p>Intro <strong>gras</strong> et <em>italique</em>.</p>
            <ul>
                <li>un ;</li>
                <li>deux.</li>
            </ul>
            <p>Fin<br />ligne.</p>`;
        expect(htmlToForum(html)).toBe('Intro [b]gras[/b] et [i]italique[/i].\n\n[0] un ;\n[0] deux.\n\nFin\nligne.');
    });

    it('drops unknown tags and decodes entities', (): void => {
        expect(htmlToForum('<code>{d6}</code> &gt; A&nbsp;B')).toBe('{d6} > A B');
    });

    it('formats a whole page with collapsible items and section separators', (): void => {
        const page: TutorialPage = {
            title: 'Titre',
            lead: 'Intro',
            sections: [
                { title: 'Groupe', items: [{ title: 'A', content: '<p>a</p>' }], outro: 'Fin' },
                { items: [{ title: 'B', content: 'b' }] }
            ]
        };
        expect(tutorialToForum(page)).toBe('[b][big]Titre[/big][/b]\n\nIntro\n\n[b]Groupe[/b]\n\n[collapse=A]a[/collapse]\n\nFin\n\n{hr}\n\n[collapse=B]b[/collapse]');
    });
});
