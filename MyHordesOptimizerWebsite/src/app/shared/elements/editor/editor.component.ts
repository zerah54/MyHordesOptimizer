import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    Optional,
    Output,
    SecurityContext,
    Self,
    SimpleChanges,
    ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { DomSanitizer } from '@angular/platform-browser';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';
import { Subject } from 'rxjs';
import { Imports } from '../../../_abstract_model/types/_types';

const angular_common: Imports = [FormsModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatFormFieldModule];

@Component({
    selector: 'mho-editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.scss'],
    providers: [
        {
            provide: MatFormFieldControl,
            useExisting: EditorComponent
        }
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes, AngularEditorModule]
})
export class EditorComponent implements ControlValueAccessor, OnChanges, OnDestroy, MatFormFieldControl<string> {

    @HostBinding('class.floating')
    get shouldLabelFloat(): boolean {
        return true;
    }

    /** Le nom du formcontrol */
    @Input() name!: string;
    /** Le libellé du champ */
    @Input() label!: string;
    @Input() showToolbarOnFocus!: boolean;

    @Input() set readonly(readonly: boolean) {
        this.editorConfig.editable = !readonly;
        this.cdr.detectChanges();
    }

    @Input() set content(content: string) {
        if (content !== undefined && content !== null) {
            this.sanitized_content = this.sanitizer.sanitize(SecurityContext.HTML, content) ?? '';
        } else {
            this.sanitized_content = content;
        }
        this.cdr.detectChanges();
        this.stateChanges.next();
    }

    @Input() set spellcheck(spellcheck: boolean) {
        if (spellcheck !== undefined && spellcheck !== null) {
            this.editorConfig.spellcheck = spellcheck;
            this.cdr.detectChanges();
        }
    }

    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input('aria-describedby') userAriaDescribedBy!: string;

    @Input()
    get required(): boolean {
        return this._required;
    }

    set required(req: boolean) {
        this._required = coerceBooleanProperty(req);
        this.stateChanges.next();
    }

    @Input()
    get disabled(): boolean {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._disabled = coerceBooleanProperty(value);
        // this._disabled ? this.parts.disable() : this.parts.enable();
        this.stateChanges.next();
    }

    @Output() contentChange: EventEmitter<string> = new EventEmitter();

    public onChange!: () => void;
    public onTouched!: () => void;

    public sanitized_content!: string;
    public editorConfig: AngularEditorConfig = {
        spellcheck: true,
        editable: true,
        toolbarHiddenButtons: [
            ['insertImage', 'insertVideo']
        ]
    };
    public stateChanges: Subject<void> = new Subject<void>();
    public value!: string;
    public id!: string;
    public placeholder!: string;
    public focused!: boolean;
    public empty!: boolean;
    public controlType?: string;
    public autofilled?: boolean;
    public touched: boolean = false;

    private _required: boolean = false;
    private _disabled: boolean = false;

    constructor(public sanitizer: DomSanitizer, private cdr: ChangeDetectorRef, @Optional() @Self() public ngControl: NgControl,
                private element_ref: ElementRef) {
        // Replace the provider from above with this.
        if (this.ngControl !== null) {
            // Setting the value accessor directly (instead of using
            // the providers) to avoid running into a circular import.
            this.ngControl.valueAccessor = this;
        }

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['showToolbarOnFocus']) {
            this.editorConfig.showToolbar = !changes['showToolbarOnFocus'].currentValue;
        }
    }

    ngOnDestroy(): void {
        this.stateChanges.complete();
    }

    public updateValue(value: string): void {
        this.contentChange.emit(value);
        this.cdr.detectChanges();
    }

    public showToolbar(): void {
        if (this.showToolbarOnFocus) {
            this.editorConfig.showToolbar = true;
        }
    }

    public hideToolbar(): void {
        if (this.showToolbarOnFocus) {
            this.editorConfig.showToolbar = false;
        }
    }

    public writeValue(content: string): void {
        this.sanitized_content = content;
    }

    public registerOnChange(onChange: () => void): void {
        this.onChange = onChange;
    }

    public registerOnTouched(onTouched: () => void): void {
        this.onTouched = onTouched;
    }

    /** Ne pas retirer / Permet la gestion native de l'erreur en tant que FormField */
    get errorState(): boolean {
        return (this.ngControl?.control?.invalid && this.ngControl?.control.touched) ?? false;
    }

    public onFocusIn(): void {
        if (!this.focused) {
            this.focused = true;
            this.stateChanges.next();
        }
        this.showToolbar();
    }

    public onFocusOut(event: FocusEvent): void {
        if (!this.element_ref.nativeElement.contains(event.relatedTarget as Element)) {
            this.touched = true;
            this.focused = false;
            this.stateChanges.next();
        }
        this.hideToolbar();
    }

    public setDescribedByIds(ids: string[]): void {
        const controlElement: HTMLElement = this.element_ref.nativeElement.querySelector('.angular-editor');
        controlElement.setAttribute('aria-describedby', ids.join(' '));
    }

    public onContainerClick(event: MouseEvent): void {
        if ((event.target as Element).tagName.toLowerCase() !== 'input') {
            this.element_ref.nativeElement.querySelector('input').focus();
        }
    }
}
