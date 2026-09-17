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
        const editor: Editor | undefined = (component as unknown as {
            editor: () => Editor | undefined;
        }).editor();

        editor?.commands.setContent('<p>changed</p>');

        expect(emitted).toEqual(['<p>changed</p>']);
    });

    it('reports empty as true when the content is empty', async (): Promise<void> => {
        await setup();

        component.writeValue('');

        expect(component.empty).toBe(true);
    });

    it('reports empty as false once content is written', async (): Promise<void> => {
        await setup();

        component.writeValue('<p>hello</p>');

        expect(component.empty).toBe(false);
    });

    it('focuses the underlying editor on container click', async (): Promise<void> => {
        await setup();
        const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

        component.onContainerClick();
        await new Promise<void>((resolve: () => void): void => { requestAnimationFrame(resolve); });

        const editable: HTMLElement | null = fixture.nativeElement.querySelector('.ProseMirror');
        expect(editable).not.toBeNull();
        expect(focusSpy.mock.contexts.at(-1)).toBe(editable as HTMLElement);
    });

    it('does not steal focus from the toolbar when a container click originates there', async (): Promise<void> => {
        await setup();
        const editor: Editor = (component as unknown as { editor: () => Editor }).editor();
        const focusCommandSpy = vi.spyOn(editor.commands, 'focus');
        const toolbarSelect: HTMLElement | null = fixture.nativeElement.querySelector('[data-action="heading"]');
        expect(toolbarSelect).not.toBeNull();

        component.onContainerClick({ target: toolbarSelect } as unknown as MouseEvent);

        expect(focusCommandSpy).not.toHaveBeenCalled();
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

    it('always exposes the floating host class', async (): Promise<void> => {
        await setup();

        expect(component.shouldLabelFloat).toBe(true);
        expect(fixture.nativeElement.classList.contains('floating')).toBe(true);
    });

    it('coerces required to a boolean and emits a state change', async (): Promise<void> => {
        await setup();
        let emissionCount: number = 0;
        component.stateChanges.subscribe((): number => emissionCount++);

        component.required = 'true' as unknown as boolean;

        expect(component.required).toBe(true);
        expect(emissionCount).toBe(1);
    });

    it('coerces disabled to a boolean, updates editor editability and emits a state change', async (): Promise<void> => {
        await setup();
        let emissionCount: number = 0;
        component.stateChanges.subscribe((): number => emissionCount++);
        const editor: Editor | undefined = (component as unknown as {
            editor: () => Editor | undefined;
        }).editor();

        component.disabled = 'true' as unknown as boolean;

        expect(component.disabled).toBe(true);
        expect(editor?.isEditable).toBe(false);
        expect(emissionCount).toBeGreaterThanOrEqual(1);
    });

    it('creates the editor as non-editable when disabled is set before render', async (): Promise<void> => {
        await TestBed.configureTestingModule({
            imports: [TiptapEditorComponent],
            providers: [{ provide: ApiService, useValue: { getItems: (): unknown => of([]) } }]
        }).compileComponents();
        fixture = TestBed.createComponent(TiptapEditorComponent);
        component = fixture.componentInstance;
        component.disabled = true;

        fixture.detectChanges();

        const editor: Editor | undefined = (component as unknown as {
            editor: () => Editor | undefined;
        }).editor();
        expect(editor?.isEditable).toBe(false);
    });

    it('sets aria-describedby on the editable element', async (): Promise<void> => {
        await setup();

        component.setDescribedByIds(['hint-1', 'error-2']);

        const editable: HTMLElement | null = fixture.nativeElement.querySelector('.ProseMirror');
        expect(editable?.getAttribute('aria-describedby')).toBe('hint-1 error-2');
    });

    it('destroys the editor and completes stateChanges on ngOnDestroy', async (): Promise<void> => {
        await setup();
        const editor: Editor | undefined = (component as unknown as {
            editor: () => Editor | undefined;
        }).editor();
        const destroySpy = vi.spyOn(editor as Editor, 'destroy');
        let completed: boolean = false;
        component.stateChanges.subscribe({ complete: (): boolean => completed = true });

        component.ngOnDestroy();

        expect(destroySpy).toHaveBeenCalled();
        expect(completed).toBe(true);
    });
});
