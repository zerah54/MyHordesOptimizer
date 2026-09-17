import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ANIMATION_MODULE_TYPE, ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';
import { By } from '@angular/platform-browser';
import { Editor } from '@tiptap/core';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color, FontSize, TextStyle } from '@tiptap/extension-text-style';
import { StarterKit } from '@tiptap/starter-kit';
import moment from 'moment';
import { of } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { Item } from '../../_abstract_model/types/item.class';
import { TiptapToolbarComponent } from './tiptap-toolbar.component';

/** Reproduit l'usage reel : la toolbar est rendue a l'interieur du mat-form-field hote (cf. tiptap-editor.component). */
@Component({
    template: `<mat-form-field style="display: block; width: 500px">
        <input matInput style="display: none">
        <mho-tiptap-toolbar [editor]="editor"></mho-tiptap-toolbar>
    </mat-form-field>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatFormFieldModule, MatInputModule, TiptapToolbarComponent]
})
class HostFormFieldComponent {
    public editor!: Editor;
}

function fakeItem(uid: string, img: string, label: string): Item {
    const item: Item = new Item();
    item.uid = uid;
    item.img = img;
    item.img_broken = null;
    item.label = { [moment.locale()]: label };
    return item;
}

const FAKE_ITEMS: Item[] = [
    fakeItem('wood_#00', 'item/item_wood.gif', 'Planche'),
    fakeItem('water_#00', 'item/item_water.gif', 'Eau')
];

describe('TiptapToolbarComponent', (): void => {
    let fixture: ComponentFixture<TiptapToolbarComponent>;
    let editor: Editor;

    beforeEach((): void => {
        // Bug connu Vitest/jsdom (vitest-dev/vitest#4685, angular/components#32389) : le CDK
        // harness construit ses événements avec `view: window`, mais sous le pool par défaut de
        // Vitest, ce `window` n'est pas reconnu comme une instance du realm Window de jsdom — le
        // constructeur natif rejette `view`. Pas de correctif amont disponible et pas d'option
        // d'accès à la config Vitest via ce builder Angular ; on neutralise `view` avant de
        // déléguer au vrai constructeur (`view` omis retombe sur `null`, valide côté spec UIEvent).
        // PointerEvent a un repli natif dans le CDK (dispatchPointerEventIfSupported) : on le
        // laisse tomber directement, seuls les événements souris restent nécessaires ici.
        vi.stubGlobal('PointerEvent', undefined);
        const RealMouseEvent: typeof MouseEvent = MouseEvent;
        vi.stubGlobal('MouseEvent', class extends RealMouseEvent {
            public constructor(type: string, eventInitDict?: MouseEventInit) {
                super(type, { ...eventInitDict, view: undefined });
            }
        });

        editor = new Editor({
            element: document.createElement('div'),
            extensions: [
                StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] }), Highlight.configure({ multicolor: true }),
                TextStyle, Color, FontSize, TaskList, TaskItem.configure({ nested: true }), TableKit, Image.configure({ inline: true })
            ],
            content: '<p>hello</p>'
        });
        editor.commands.setTextSelection({ from: 1, to: 6 });
    });

    afterEach((): void => {
        editor.destroy();
        vi.unstubAllGlobals();
    });

    async function setup(): Promise<void> {
        await TestBed.configureTestingModule({
            imports: [TiptapToolbarComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }, { provide: ApiService, useValue: { getItems: (): unknown => of(FAKE_ITEMS) } }]
        }).compileComponents();
        fixture = TestBed.createComponent(TiptapToolbarComponent);
        fixture.componentRef.setInput('editor', editor);
        fixture.detectChanges();
    }

    async function selectOption(dataAction: string, optionText: string): Promise<void> {
        const loader = TestbedHarnessEnvironment.loader(fixture);
        const select: MatSelectHarness = await loader.getHarness(MatSelectHarness.with({ selector: `[data-action="${dataAction}"]` }));
        await select.open();
        await select.clickOptions({ text: optionText });
    }

    /** MatTabGroupHarness.selectTab() ferme le mat-menu hote (l'evenement de clic synthetise par le harness
     * est traite comme un clic exterieur par le dispatcher CDK) ; un clic DOM natif sur le tab ne le ferme pas. */
    function selectTab(label: string): void {
        const tab: HTMLElement | undefined = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'))
            .find((el: HTMLElement): boolean => el.textContent?.trim() === label);
        tab!.click();
        fixture.detectChanges();
    }

    it('toggles bold on the editor when the bold button is clicked', async (): Promise<void> => {
        await setup();

        fixture.debugElement.query(By.css('[data-action="bold"]')).nativeElement.click();

        expect(editor.isActive('bold')).toBe(true);
    });

    it('toggles a bullet list on the editor when the bullet list button is clicked', async (): Promise<void> => {
        await setup();

        fixture.debugElement.query(By.css('[data-action="bulletList"]')).nativeElement.click();

        expect(editor.isActive('bulletList')).toBe(true);
    });

    it('sets text alignment on the editor when an align button is clicked', async (): Promise<void> => {
        await setup();

        fixture.debugElement.query(By.css('[data-action="align-center"]')).nativeElement.click();

        expect(editor.isActive({ textAlign: 'center' })).toBe(true);
    });

    // jsdom ne calcule aucun layout réel : getBoundingClientRect() renvoie toujours 0 pour tous les
    // éléments (overlay comme mat-form-field), rendant la comparaison de largeurs sans objet ici.
    // Ce test vérifie un comportement CSS réel (non-régression sur le redimensionnement de
    // l'overlay) qui nécessite un vrai moteur de rendu — à réactiver si un mode navigateur réel
    // est un jour configuré pour Vitest (options `browsers`/`runner: 'vitest', browsers: [...]`).
    it.skip('does not size the select overlay panel to an ancestor mat-form-field', async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [HostFormFieldComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }, { provide: ApiService, useValue: { getItems: (): unknown => of(FAKE_ITEMS) } }]
        }).compileComponents();
        const hostFixture: ComponentFixture<HostFormFieldComponent> = TestBed.createComponent(HostFormFieldComponent);
        hostFixture.componentInstance.editor = editor;
        hostFixture.detectChanges();

        const loader = TestbedHarnessEnvironment.loader(hostFixture);
        const select: MatSelectHarness = await loader.getHarness(MatSelectHarness.with({ selector: '[data-action="heading"]' }));
        await select.open();

        const overlayWidth: number = document.querySelector('.cdk-overlay-pane')!.getBoundingClientRect().width;
        const formFieldWidth: number = hostFixture.nativeElement.querySelector('mat-form-field').getBoundingClientRect().width;

        expect(overlayWidth).toBeLessThan(formFieldWidth);
    });

    it('sets the heading level from the heading select', async (): Promise<void> => {
        await setup();

        await selectOption('heading', 'Titre 2');

        expect(editor.isActive('heading', { level: 2 })).toBe(true);
    });

    it('offers heading levels up to H6', async (): Promise<void> => {
        await setup();

        await selectOption('heading', 'Titre 6');

        expect(editor.isActive('heading', { level: 6 })).toBe(true);
    });

    it('inserts a link on the selected text when the link button is clicked', async (): Promise<void> => {
        vi.spyOn(window, 'prompt').mockReturnValue('https://example.com');
        await setup();

        fixture.debugElement.query(By.css('[data-action="link"]')).nativeElement.click();

        expect(editor.isActive('link', { href: 'https://example.com' })).toBe(true);
    });

    it('sets the highlight color when the highlight color input changes', async (): Promise<void> => {
        await setup();

        const input: HTMLInputElement = fixture.debugElement.query(By.css('[data-action="highlight-color"]')).nativeElement;
        input.value = '#ff0000';
        input.dispatchEvent(new Event('input'));

        expect(editor.isActive('highlight', { color: '#ff0000' })).toBe(true);
    });

    it('sets the text color when the text color input changes', async (): Promise<void> => {
        await setup();

        const input: HTMLInputElement = fixture.debugElement.query(By.css('[data-action="text-color"]')).nativeElement;
        input.value = '#00ff00';
        input.dispatchEvent(new Event('input'));

        expect(editor.isActive('textStyle', { color: '#00ff00' })).toBe(true);
    });

    it('sets the font size from the font size select', async (): Promise<void> => {
        await setup();

        await selectOption('fontSize', '24');

        expect(editor.isActive('textStyle', { fontSize: '24px' })).toBe(true);
    });

    it('offers font sizes beyond the original 12-32 range', async (): Promise<void> => {
        await setup();

        await selectOption('fontSize', '48');

        expect(editor.isActive('textStyle', { fontSize: '48px' })).toBe(true);
    });

    it('unsets the font size when the font size select is reset to normal', async (): Promise<void> => {
        await setup();
        await selectOption('fontSize', '24');
        expect(editor.isActive('textStyle', { fontSize: '24px' })).toBe(true);

        await selectOption('fontSize', 'Normal');

        expect(editor.isActive('textStyle', { fontSize: '24px' })).toBe(false);
    });

    it('toggles a code block on the editor when the code block button is clicked', async (): Promise<void> => {
        await setup();

        fixture.debugElement.query(By.css('[data-action="codeBlock"]')).nativeElement.click();

        expect(editor.isActive('codeBlock')).toBe(true);
    });

    it('toggles a blockquote on the editor when the blockquote button is clicked', async (): Promise<void> => {
        await setup();

        fixture.debugElement.query(By.css('[data-action="blockquote"]')).nativeElement.click();

        expect(editor.isActive('blockquote')).toBe(true);
    });

    it('inserts a MyHordes emote image when an emote is picked from the menu', async (): Promise<void> => {
        await setup();
        const loader = TestbedHarnessEnvironment.loader(fixture);
        const trigger: MatMenuHarness = await loader.getHarness(MatMenuHarness.with({ selector: '[data-action="emote"]' }));
        await trigger.open();

        const emoteOption: HTMLElement | null = document.querySelector('[data-emote=":smile:"]');
        expect(emoteOption).not.toBeNull();
        emoteOption!.click();

        expect(editor.getHTML()).toContain('img/hordes_img/emotes/smile.gif');
    });

    it('groups the emote picker into tabs, starting with Émoticônes', async (): Promise<void> => {
        await setup();
        const loader = TestbedHarnessEnvironment.loader(fixture);
        const trigger: MatMenuHarness = await loader.getHarness(MatMenuHarness.with({ selector: '[data-action="emote"]' }));
        await trigger.open();

        const tabGroup: MatTabGroupHarness = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(MatTabGroupHarness);
        const tabs = await tabGroup.getTabs();
        const labels: string[] = await Promise.all(tabs.map((tab) => tab.getLabel()));

        expect(labels).toContain('Émoticônes');
    });

    /**
     * mat-menu ferme le panel sur TOUT clic en son sein (le template de MatMenu porte
     * (click)="closed.emit('click')" sur la racine .mat-mdc-menu-panel, sans exception pour les
     * mat-menu-item). C'est masque avec le mode NoopAnimations : l'animation CSS de sortie
     * (~100-125ms, un keyframe CSS pur, sans lien avec ANIMATION_MODULE_TYPE) retarde le
     * detachement du panel, et les autres tests de ce fichier ne verifient rien apres ce delai.
     * Ce test n'override pas ANIMATION_MODULE_TYPE (etat par defaut = animations actives, comme
     * en prod) et attend au-dela de l'animation pour verifier que le panel reste attache.
     */
    it('keeps the emote menu open past the exit-animation delay when a tab is clicked', async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [TiptapToolbarComponent],
            providers: [{ provide: ApiService, useValue: { getItems: (): unknown => of(FAKE_ITEMS) } }]
        }).compileComponents();
        const realFixture: ComponentFixture<TiptapToolbarComponent> = TestBed.createComponent(TiptapToolbarComponent);
        realFixture.componentRef.setInput('editor', editor);
        realFixture.detectChanges();

        const loader = TestbedHarnessEnvironment.loader(realFixture);
        const trigger: MatMenuHarness = await loader.getHarness(MatMenuHarness.with({ selector: '[data-action="emote"]' }));
        await trigger.open();

        const tabs: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'));
        tabs[3].click();
        realFixture.detectChanges();

        await new Promise<void>((resolve) => setTimeout(resolve, 300));
        realFixture.detectChanges();

        expect(document.querySelector('.mho-tiptap-emote-menu')).not.toBeNull();
    });

    it('inserts a MyHordes icon from the "Icônes MyHordes" tab', async (): Promise<void> => {
        await setup();
        const loader = TestbedHarnessEnvironment.loader(fixture);
        const trigger: MatMenuHarness = await loader.getHarness(MatMenuHarness.with({ selector: '[data-action="emote"]' }));
        await trigger.open();
        selectTab('Icônes MyHordes');

        const homeIcon: HTMLElement | null = document.querySelector('[data-emote=":home:"]');
        expect(homeIcon).not.toBeNull();
        homeIcon!.click();

        expect(editor.getHTML()).toContain('hordes_img/emotes/home.gif');
    });

    it('inserts a unicode emoji as plain text from the Emojis tab', async (): Promise<void> => {
        await setup();
        const loader = TestbedHarnessEnvironment.loader(fixture);
        const trigger: MatMenuHarness = await loader.getHarness(MatMenuHarness.with({ selector: '[data-action="emote"]' }));
        await trigger.open();
        selectTab('Emojis');

        // jsdom (moteur de sélecteurs nwsapi) ne matche pas les caractères unicode astraux (paire
        // de substitution UTF-16) dans un sélecteur d'attribut CSS : l'élément existe bien dans le
        // DOM, seul `querySelector('[data-emoji="😀"]')` échoue à le trouver.
        const smileyOption: HTMLElement | undefined = Array.from(document.querySelectorAll<HTMLElement>('[data-emoji]'))
            .find((el: HTMLElement): boolean => el.getAttribute('data-emoji') === '😀');
        expect(smileyOption).not.toBeUndefined();
        smileyOption!.click();

        expect(editor.getText()).toContain('😀');
        expect(editor.getHTML()).not.toContain('<img');
    });

    it('shows the item referential in the Objets tab', async (): Promise<void> => {
        await setup();
        const loader = TestbedHarnessEnvironment.loader(fixture);
        const trigger: MatMenuHarness = await loader.getHarness(MatMenuHarness.with({ selector: '[data-action="emote"]' }));
        await trigger.open();
        selectTab('Objets');

        expect(document.querySelector('[data-item="wood_#00"]')).not.toBeNull();
        expect(document.querySelector('[data-item="water_#00"]')).not.toBeNull();
    });

    it('filters the Objets tab as the search field changes', async (): Promise<void> => {
        await setup();
        const loader = TestbedHarnessEnvironment.loader(fixture);
        const trigger: MatMenuHarness = await loader.getHarness(MatMenuHarness.with({ selector: '[data-action="emote"]' }));
        await trigger.open();
        selectTab('Objets');

        const search: HTMLInputElement = document.querySelector('.mho-tiptap-emote-menu input[matInput]')!;
        search.value = 'Planche';
        search.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(document.querySelector('[data-item="wood_#00"]')).not.toBeNull();
        expect(document.querySelector('[data-item="water_#00"]')).toBeNull();
    });

    it('inserts an item image when an item is picked from the Objets tab', async (): Promise<void> => {
        await setup();
        const loader = TestbedHarnessEnvironment.loader(fixture);
        const trigger: MatMenuHarness = await loader.getHarness(MatMenuHarness.with({ selector: '[data-action="emote"]' }));
        await trigger.open();
        selectTab('Objets');

        const itemOption: HTMLElement = document.querySelector('[data-item="wood_#00"]')!;
        itemOption.click();

        expect(editor.getHTML()).toContain('item/item_wood.gif');
    });

    it('clears formatting on the selection when the clear formatting button is clicked', async (): Promise<void> => {
        await setup();
        editor.chain().focus().toggleBold().toggleHeading({ level: 2 }).run();
        expect(editor.isActive('bold')).toBe(true);
        expect(editor.isActive('heading', { level: 2 })).toBe(true);

        fixture.debugElement.query(By.css('[data-action="clearFormat"]')).nativeElement.click();

        expect(editor.isActive('bold')).toBe(false);
        expect(editor.isActive('heading')).toBe(false);
    });

    it('toggles a task list on the editor when the task list button is clicked', async (): Promise<void> => {
        await setup();

        fixture.debugElement.query(By.css('[data-action="taskList"]')).nativeElement.click();

        expect(editor.isActive('taskList')).toBe(true);
    });

    it('inserts a horizontal rule when the horizontal rule button is clicked', async (): Promise<void> => {
        await setup();

        fixture.debugElement.query(By.css('[data-action="horizontalRule"]')).nativeElement.click();

        expect(editor.getHTML()).toContain('<hr>');
    });

    it('inserts a table when the table button is clicked', async (): Promise<void> => {
        await setup();

        fixture.debugElement.query(By.css('[data-action="insertTable"]')).nativeElement.click();

        expect(editor.isActive('table')).toBe(true);
    });
});
