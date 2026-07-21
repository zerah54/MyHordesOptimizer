import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    inject,
    Input,
    input,
    InputSignalWithTransform,
    OnChanges,
    OnDestroy,
    output,
    OutputEmitterRef,
    SecurityContext,
    SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { DomSanitizer } from '@angular/platform-browser';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';
import { Subject } from 'rxjs';

import { Imports } from '../../_abstract_model/types/_types';

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
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes, AngularEditorModule]
})
export class EditorComponent implements ControlValueAccessor, OnChanges, OnDestroy, MatFormFieldControl<string> {
    public ngControl: NgControl | null = inject(NgControl, { optional: true, self: true });
    // public name: InputSignal<string> = input('');
    /** Le libellé du champ */
    // public label: InputSignal<string> = input('');
    public showToolbarOnFocus: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    //  is not migrated.
    @Input('aria-describedby') public userAriaDescribedBy!: string;
    public contentChange: OutputEmitterRef<string> = output();
    public onChange!: () => void;
    public onTouched!: () => void;

    // TODO: Skipped for migration because:
    public stateChanges: Subject<void> = new Subject<void>();

    // TODO: Skipped for migration because:
    public value!: string;

    // TODO: Skipped for migration because:
    public id!: string;

    // TODO: Skipped for migration because:
    //  This input overrides a field from a superclass, while the superclass field
    public placeholder!: string;

    // TODO: Skipped for migration because:
    public focused!: boolean;
    public empty!: boolean;

    // TODO: Skipped for migration because:
    public controlType?: string;
    public autofilled?: boolean;
    public touched: boolean = false;
    protected sanitized_content!: string;
    protected editorConfig: AngularEditorConfig = {
        spellcheck: true,
        editable: true,
        toolbarHiddenButtons: [
            ['insertImage', 'insertVideo']
        ]
    };
    private sanitizer: DomSanitizer = inject(DomSanitizer);
    private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
    private element_ref: ElementRef = inject(ElementRef);

    public constructor() {
        // Replace the provider from above with this.
        if (this.ngControl !== null) {
            // Setting the value accessor directly (instead of using
            // the providers) to avoid running into a circular import.
            this.ngControl.valueAccessor = this;
        }

    }

    @HostBinding('class.floating')
    public get shouldLabelFloat(): boolean {
        return true;
    }

    //  Accessor inputs cannot be migrated as they are too complex.
    @Input() public set readonly(readonly: boolean) {
        this.editorConfig.editable = !readonly;
        this.cdr.detectChanges();
    }

    //  Accessor inputs cannot be migrated as they are too complex.
    @Input() public set content(content: string) {
        if (content !== undefined && content !== null) {
            this.sanitized_content = this.sanitizer.sanitize(SecurityContext.HTML, content) ?? '';
        } else {
            this.sanitized_content = content;
        }
        this.cdr.detectChanges();
        this.stateChanges.next();
    }

    //  Accessor inputs cannot be migrated as they are too complex.
    @Input() public set spellcheck(spellcheck: boolean) {
        if (spellcheck !== undefined && spellcheck !== null) {
            this.editorConfig.spellcheck = spellcheck;
            this.cdr.detectChanges();
        }
    }

    private _required: boolean = false;

    //  Accessor inputs cannot be migrated as they are too complex.
    @Input()
    public get required(): boolean {
        return this._required;
    }

    public set required(req: boolean) {
        this._required = coerceBooleanProperty(req);
        this.stateChanges.next();
    }

    private _disabled: boolean = false;

    //  Accessor inputs cannot be migrated as they are too complex.
    @Input()
    public get disabled(): boolean {
        return this._disabled;
    }

    public set disabled(value: boolean) {
        this._disabled = coerceBooleanProperty(value);
        // this._disabled ? this.parts.disable() : this.parts.enable();
        this.stateChanges.next();
    }

    /** Ne pas retirer / Permet la gestion native de l'erreur en tant que FormField */
    public get errorState(): boolean {
        return (this.ngControl?.control?.invalid && this.ngControl?.control.touched) ?? false;
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['showToolbarOnFocus']) {
            this.editorConfig.showToolbar = !changes['showToolbarOnFocus'].currentValue;
        }
    }

    public ngOnDestroy(): void {
        this.stateChanges.complete();
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

    public setDescribedByIds(ids: string[]): void {
        const controlElement: HTMLElement = this.element_ref.nativeElement.querySelector('.angular-editor');
        controlElement.setAttribute('aria-describedby', ids.join(' '));
    }

    public onContainerClick(event: MouseEvent): void {
        if ((event.target as Element).tagName.toLowerCase() !== 'input') {
            this.element_ref.nativeElement.querySelector('input').focus();
        }
    }

    protected updateValue(value: string): void {
        this.contentChange.emit(value);
        this.cdr.detectChanges();
    }

    protected onFocusIn(): void {
        if (!this.focused) {
            this.focused = true;
            this.stateChanges.next();
        }
        this.showToolbar();
    }

    protected onFocusOut(event: FocusEvent): void {
        if (!this.element_ref.nativeElement.contains(event.relatedTarget as Element)) {
            this.touched = true;
            this.focused = false;
            this.stateChanges.next();
        }
        this.hideToolbar();
    }

    private showToolbar(): void {
        if (this.showToolbarOnFocus()) {
            this.editorConfig.showToolbar = true;
        }
    }

    private hideToolbar(): void {
        if (this.showToolbarOnFocus()) {
            this.editorConfig.showToolbar = false;
        }
    }
}
