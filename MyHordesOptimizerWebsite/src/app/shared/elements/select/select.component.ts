import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import {
    booleanAttribute,
    Component,
    ElementRef,
    EventEmitter,
    HostBinding,
    input,
    Input,
    InputSignal,
    InputSignalWithTransform,
    OnDestroy,
    Optional,
    Output,
    Self,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { AbstractControl, ControlValueAccessor, NgControl, UntypedFormControl, ValidationErrors, Validator, Validators } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatOption, MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormField, MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Imports } from '../../../_abstract_model/types/_types';
import { normalizeString } from '../../utilities/string.utils';
import { BindPipe, BindValuePipe } from './bind.pipe';
import { IconPipe } from './icon.pipe';
import { LabelPipe, MultipleLabelPipe } from './label.pipe';

const angular_common: Imports = [CommonModule, NgOptimizedImage, NgTemplateOutlet];
const components: Imports = [];
const pipes: Imports = [BindPipe, BindValuePipe, IconPipe, LabelPipe, MultipleLabelPipe];
const material_modules: Imports = [MatChipsModule, MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatOptionModule, MatSelectModule];

@Component({
    selector: 'mho-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: MatFormFieldControl,
            multi: true,
            useExisting: SelectComponent
        }
    ],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class SelectComponent<T> implements ControlValueAccessor, Validator, MatFormFieldControl<T | string | T[] | string[] | undefined>, OnDestroy {

    private static nextId: number = 0;

    @HostBinding('style.display') display: string = 'contents';
    @HostBinding('class.floating') floating: boolean = this.shouldLabelFloat;

    // get reference to the input element
    @ViewChild(MatSelect) select!: MatSelect;
    @ViewChild(MatInput) filter_input!: MatInput;

    public multiple: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});
    public noLabel: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});
    public emptyOption: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});
    public clearable: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});
    public bindLabel: InputSignal<string | undefined> = input();
    public bindValue: InputSignal<string | undefined> = input();
    public bindIcon: InputSignal<string | undefined> = input();

    @Input() moreInfo?: (element: string | T) => string;
    //current form control input. helpful in validating and accessing form control
    @Input() form_control: AbstractControl = new UntypedFormControl();
    @Input() searchable: boolean = true;
    @Input() class: string = '';
    /** Doit-on afficher sous forme de chips les différentes valeurs ? Fonctionne uniquement si "multiple" */
    @Input() chips: boolean = true;

    @Input() set options(options: (T | string)[]) {
        this.displayed_options = [...options];
        this.complete_options = [...options];
    }

    @Input() userAriaDescribedBy!: string;

    @Input() get placeholder(): string {
        return this._placeholder;
    }

    set placeholder(plh: string) {
        this._placeholder = plh;
        this.stateChanges.next();
    }

    @Input() get required(): boolean {
        return this._required;
    }

    set required(req: boolean) {
        this._required = coerceBooleanProperty(req);
        this.stateChanges.next();
    }

    @Input() get disabled(): boolean {
        return this._disabled;
    }

    set disabled(value: boolean) {
        this._disabled = coerceBooleanProperty(value);
        this._disabled ? this.form_control.disable() : this.form_control.enable();
        this.stateChanges.next();
    }

    @Output() filterChange: EventEmitter<T | string | T[] | string[] | undefined> = new EventEmitter<T | string | T[] | string[] | undefined>();
    @Output() closed: EventEmitter<void> = new EventEmitter<void>();


    get shouldLabelFloat(): boolean {
        return this.focused || !this.empty;
    }

    public id: string = `mho-select-${SelectComponent.nextId++}`;

    public displayed_options: (T | string)[] = [];

    public stateChanges: Subject<void> = new Subject<void>();
    public controlType?: string | undefined;
    public autofilled?: boolean | undefined;

    public focused: boolean = false;

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    protected complete_options: (T | string)[] = [];
    //The internal data model for form control value access
    private innerValue: T | string | T[] | string[] | undefined = undefined;
    /** errors for the form control will be stored in this array */
    private errors: string[] = [$localize`Ce champ est obligatoire`];
    private touched: boolean = false;
    private _placeholder!: string;
    private _required: boolean = false;
    private _disabled: boolean = false;

    private label_pipe: LabelPipe<T> = new LabelPipe();

    /** propagate changes into the custom form control */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public propagateChange = (_: unknown): void => {
        //no-empty
    };
    public onTouched = (): void => {
        //no-empty
    };

    public constructor(@Optional() @Self() public ngControl: NgControl, @Optional() @Self() public validator: Validators,
                       @Optional() public parent_form_field: MatFormField, private _elementRef: ElementRef) {
        if (this.ngControl !== null) {
            this.ngControl.valueAccessor = this;
        }
    }

    // event fired when input value is changed . later propagated up to the form control using the custom value accessor interface
    public onChange(value: T | string | undefined | T[] | string[]): void {
        //set changed value
        this.innerValue = value;
        // propagate value into form control using control value accessor interface
        this.propagateChange(this.innerValue);

        //reset errors
        this.errors = [];
        //setting, resetting error messages into an array (to loop) and adding the validation messages to show below the field area
        for (const key in this.form_control.errors) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.form_control.errors.hasOwnProperty(key)) {
                this.errors.push(this.form_control.errors[key]);
            }
        }
    }

    public remove(value: unknown): void {
        Array.from(this.select.options)
            .filter((option: MatOption<unknown>) => value === option.value)
            .forEach((option: MatOption<unknown>) => option.deselect());
        // this.updateValue(<TYPE>this.value);
        this.select.options.notifyOnChanges();
    }

    public get errorState(): boolean {
        return this.form_control.invalid && this.touched;
    }

    //get accessor
    public get value(): T | string | T[] | string[] | undefined {
        return this.innerValue;
    }

    //set accessor including call the onchange callback
    public set value(v: T | string | T[] | string[] | undefined) {
        if (v !== this.innerValue) {
            this.stateChanges.next();
            this.innerValue = v;
        }
    }

    public setDescribedByIds(ids: string[]): void {
        const controlElement: HTMLElement = this._elementRef.nativeElement.querySelector('.mho-select-input-container')!;
        if (controlElement) {
            controlElement.setAttribute('aria-describedby', ids.join(' '));
        }
    }

    public onContainerClick(): void {
        if (this.filter_input) {
            this.filter_input.focus();
        }
    }

    public filter(event: Event): void {
        console.log('filter', event);
        const value: string = normalizeString((<HTMLInputElement>event.target)?.value);
        console.log('value', value);
        this.displayed_options = [...this.complete_options.filter((option: T | string) => {
            const label: string = normalizeString(this.label_pipe.transform(option, this.bindLabel() ?? ''));
            return label.indexOf(value) > -1;
        })];
        console.log('displayed_options', this.displayed_options);
    }

    //From ControlValueAccessor interface
    public writeValue(value: T | string | undefined | T[] | string[]): void {
        // console.log('value', value)
        this.innerValue = value;
        this.onChange(value);
        this.filterChange.next(value);
    }

    //From ControlValueAccessor interface
    public registerOnChange(fn: () => void): void {
        this.propagateChange = fn;
    }

    //From ControlValueAccessor interface
    public registerOnTouched(): void {
        // no-empty
    }

    public onFocusIn(): void {
        if (!this.focused) {
            this.focused = true;
            this.stateChanges.next();
        }
    }

    public onFocusOut(event: FocusEvent): void {
        if (!this._elementRef.nativeElement.contains(event.relatedTarget as Element)) {
            this.touched = true;
            this.focused = false;
            this.onTouched();
            this.stateChanges.next();
        }
    }

    public get empty(): boolean {
        return this.value === undefined || this.value === null || this.value === '' || (Array.isArray(this.value) && this.value.length === 0);
    }

    public validate(control: AbstractControl): ValidationErrors | null {
        const quantity: number = control.value;
        if (quantity <= 0) {
            return {
                mustBePositive: {
                    quantity
                }
            };
        } else {
            return null;
        }
    }

    ngOnDestroy(): void {
        this.stateChanges.complete();
    }

}

