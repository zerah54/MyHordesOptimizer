import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostBinding,
    inject,
    Input,
    OnDestroy,
    SecurityContext,
    Signal,
    signal,
    viewChild,
    WritableSignal
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { DomSanitizer } from '@angular/platform-browser';
import { Editor } from '@tiptap/core';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color, FontSize, TextStyle } from '@tiptap/extension-text-style';
import { Placeholder } from '@tiptap/extensions';
import { StarterKit } from '@tiptap/starter-kit';
import { Subject } from 'rxjs';

import { TiptapToolbarComponent } from './tiptap-toolbar.component';

@Component({
    selector: 'mho-tiptap-editor',
    templateUrl: './tiptap-editor.component.html',
    styleUrls: ['./tiptap-editor.component.scss'],
    providers: [
        { provide: MatFormFieldControl, useExisting: TiptapEditorComponent }
    ],
    imports: [TiptapToolbarComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TiptapEditorComponent implements ControlValueAccessor, AfterViewInit, OnDestroy, MatFormFieldControl<string> {
    public readonly ngControl: NgControl | null = inject(NgControl, { optional: true, self: true });

    public stateChanges: Subject<void> = new Subject<void>();
    public value: string = '';
    public id!: string;
    @Input() public placeholder: string = '';
    public focused: boolean = false;
    public empty: boolean = true;
    public controlType?: string;
    public autofilled?: boolean;
    public touched: boolean = false;
    public onChange: (value: string) => void = (): void => undefined;
    public onTouched: () => void = (): void => undefined;

    /** Instance Tiptap, exposee pour le binding de la toolbar dans ce meme template. */
    protected editor: Signal<Editor | undefined>;

    private readonly editorSignal: WritableSignal<Editor | undefined> = signal(undefined);
    private readonly editorHost: Signal<ElementRef<HTMLDivElement>> = viewChild.required('editorHost');
    private readonly sanitizer: DomSanitizer = inject(DomSanitizer);
    private readonly element_ref: ElementRef = inject(ElementRef);
    private pendingContent: string = '';

    public constructor() {
        this.editor = this.editorSignal.asReadonly();
        if (this.ngControl !== null) {
            this.ngControl.valueAccessor = this;
        }
    }

    @HostBinding('class.floating')
    public get shouldLabelFloat(): boolean {
        return true;
    }

    private _required: boolean = false;

    @Input()
    public get required(): boolean {
        return this._required;
    }

    public set required(req: boolean) {
        this._required = coerceBooleanProperty(req);
        this.stateChanges.next();
    }

    private _disabled: boolean = false;

    @Input()
    public get disabled(): boolean {
        return this._disabled;
    }

    public set disabled(value: boolean) {
        this._disabled = coerceBooleanProperty(value);
        this.editor()?.setEditable(!this._disabled);
        this.stateChanges.next();
    }

    /** Ne pas retirer / Permet la gestion native de l'erreur en tant que FormField */
    public get errorState(): boolean {
        return (this.ngControl?.control?.invalid && this.ngControl?.control.touched) ?? false;
    }

    public ngAfterViewInit(): void {
        this.editorSignal.set(new Editor({
            element: this.editorHost().nativeElement,
            extensions: [
                StarterKit,
                TextAlign.configure({ types: ['heading', 'paragraph'] }),
                Highlight.configure({ multicolor: true }),
                TextStyle,
                Color,
                FontSize,
                TaskList,
                TaskItem.configure({ nested: true }),
                TableKit,
                Image.configure({ inline: true, HTMLAttributes: { class: 'mho-tiptap-emote' } }),
                Placeholder.configure({ placeholder: this.placeholder })
            ],
            content: this.pendingContent,
            editable: !this._disabled,
            onUpdate: ({ editor }): void => {
                this.value = editor.getHTML();
                this.empty = editor.isEmpty;
                this.onChange(this.value);
                this.stateChanges.next();
            }
        }));
    }

    public ngOnDestroy(): void {
        this.editorSignal()?.destroy();
        this.stateChanges.complete();
    }

    public writeValue(content: string): void {
        const sanitized: string = content ? (this.sanitizer.sanitize(SecurityContext.HTML, content) ?? '') : '';
        this.value = sanitized;
        this.empty = !sanitized;
        this.pendingContent = sanitized;
        this.editor()?.commands.setContent(sanitized, { emitUpdate: false });
    }

    public registerOnChange(onChange: (value: string) => void): void {
        this.onChange = onChange;
    }

    public registerOnTouched(onTouched: () => void): void {
        this.onTouched = onTouched;
    }

    public setDisabledState(disabled: boolean): void {
        this.disabled = disabled;
    }

    public setDescribedByIds(ids: string[]): void {
        const editable: HTMLElement | null = this.element_ref.nativeElement.querySelector('.ProseMirror');
        editable?.setAttribute('aria-describedby', ids.join(' '));
    }

    public onContainerClick(event?: MouseEvent): void {
        const target: HTMLElement | null = (event?.target ?? null) as HTMLElement | null;
        if (target?.closest('.mho-tiptap-toolbar')) {
            return;
        }
        this.editor()?.commands.focus();
    }
}
