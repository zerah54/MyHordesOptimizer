import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Editor } from '@tiptap/core';
import { of } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { TiptapEditorComponent } from './tiptap-editor.component';

describe('TiptapEditorComponent', (): void => {
    let fixture: ComponentFixture<TiptapEditorComponent>;
    let component: TiptapEditorComponent;

    async function setup(placeholder?: string): Promise<void> {
        await TestBed.configureTestingModule({
            imports: [TiptapEditorComponent],
            providers: [{ provide: ApiService, useValue: { getItems: (): unknown => of([]) } }]
        }).compileComponents();
        fixture = TestBed.createComponent(TiptapEditorComponent);
        component = fixture.componentInstance;
        if (placeholder !== undefined) {
            fixture.componentRef.setInput('placeholder', placeholder);
        }
        fixture.detectChanges();
    }

    it('renders the content passed to writeValue', async (): Promise<void> => {
        await setup();

        component.writeValue('<p>hello</p>');

        const editable: HTMLElement | null = fixture.nativeElement.querySelector('[contenteditable="true"]');
        expect(editable?.textContent).toBe('hello');
    });

    it('calls the registered onChange callback when the editor content changes', async (): Promise<void> => {
        await setup();
        const emitted: string[] = [];
        component.registerOnChange((value: string): number => emitted.push(value));
        const editor: Editor | undefined = (component as unknown as { editor: () => Editor | undefined }).editor();

        editor?.commands.setContent('<p>changed</p>');

        expect(emitted).toEqual(['<p>changed</p>']);
    });

    it('reports empty as true when the content is empty', async (): Promise<void> => {
        await setup();

        component.writeValue('');

        expect(component.empty).toBeTrue();
    });

    it('reports empty as false once content is written', async (): Promise<void> => {
        await setup();

        component.writeValue('<p>hello</p>');

        expect(component.empty).toBeFalse();
    });

    it('focuses the underlying editor on container click', async (): Promise<void> => {
        await setup();
        const focusSpy: jasmine.Spy = spyOn(HTMLElement.prototype, 'focus');

        component.onContainerClick();
        await new Promise<void>((resolve: () => void): void => { requestAnimationFrame(resolve); });

        const editable: HTMLElement | null = fixture.nativeElement.querySelector('.ProseMirror');
        expect(editable).not.toBeNull();
        expect(focusSpy.calls.mostRecent().object).toBe(editable as HTMLElement);
    });

    it('does not steal focus from the toolbar when a container click originates there', async (): Promise<void> => {
        await setup();
        const focusSpy: jasmine.Spy = spyOn(HTMLElement.prototype, 'focus');
        const toolbarSelect: HTMLElement | null = fixture.nativeElement.querySelector('[data-action="heading"]');
        expect(toolbarSelect).not.toBeNull();

        component.onContainerClick({ target: toolbarSelect } as unknown as MouseEvent);

        expect(focusSpy).not.toHaveBeenCalled();
    });

    it('renders the toolbar once the editor is ready', async (): Promise<void> => {
        await setup();

        expect(fixture.nativeElement.querySelector('mho-tiptap-toolbar')).not.toBeNull();
    });

    it('applies the configured placeholder text on the empty editor', async (): Promise<void> => {
        await setup('Ecris une note...');

        const editable: HTMLElement | null = fixture.nativeElement.querySelector('.ProseMirror p');
        expect(editable?.getAttribute('data-placeholder')).toBe('Ecris une note...');
    });

    it('has no placeholder text by default', async (): Promise<void> => {
        await setup();

        const editable: HTMLElement | null = fixture.nativeElement.querySelector('.ProseMirror p');
        expect(editable?.getAttribute('data-placeholder')).toBeFalsy();
    });
});
