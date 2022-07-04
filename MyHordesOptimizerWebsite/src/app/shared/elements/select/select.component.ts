import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, ElementRef, HostBinding, Input, OnDestroy, Optional, Self, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormControl, NgControl, ValidationErrors, Validator, Validators } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { Subject } from 'rxjs';
import { LabelPipe } from './label.pipe';

@Component({
    selector: 'mho-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss'],
    providers: [
        {
            provide: MatFormFieldControl,
            multi: true,
            useExisting: SelectComponent
        }
    ],
})
export class SelectComponent<T> implements ControlValueAccessor, Validator, MatFormFieldControl<T | string | undefined>, OnDestroy {

    @HostBinding() id = `mho-select-${SelectComponent.nextId++}`;

    @HostBinding('class.floating') get shouldLabelFloat() {
        return this.focused || !this.empty;
    }

    // get reference to the input element
    @ViewChild(MatSelect) select!: MatSelect;
    @ViewChild(MatInput) filter_input!: MatInput;

    @Input() multiple: boolean = false;
    @Input() bindLabel!: string;
    //current form control input. helpful in validating and accessing form control
    @Input() form_control: AbstractControl = new FormControl();


    @Input() set options(options: (T | string)[]) {
        this.displayed_options = [...options];
        this.complete_options = [...options];
    };

    @Input('aria-describedby') userAriaDescribedBy!: string;

    @Input() get placeholder() {
        return this._placeholder;
    }

    @Input() get required() {
        return this._required;
    }

    @Input() get disabled(): boolean { return this._disabled; }

    set required(req) {
        this._required = coerceBooleanProperty(req);
        this.stateChanges.next();
    }

    set placeholder(plh: string) {
        this._placeholder = plh;
        this.stateChanges.next();
    }

    set disabled(value: boolean) {
        this._disabled = coerceBooleanProperty(value);
        this._disabled ? this.form_control.disable() : this.form_control.enable();
        this.stateChanges.next();
    }

    public displayed_options: (T | string)[] = [];

    public stateChanges = new Subject<void>();

    private complete_options: (T | string)[] = [];
    //The internal data model for form control value access
    private innerValue: T | string | undefined = undefined;
    // errors for the form control will be stored in this array
    private errors: string[] = ['This field is required'];
    private touched: boolean = false;
    private _placeholder!: string;
    private _required = false;
    private _disabled = false;

    private label_pipe: LabelPipe<T> = new LabelPipe();

    private static nextId: number = 0; focused = false;

    //propagate changes into the custom form control
    public propagateChange = (_: any) => { }
    public onTouched = () => { }

    public constructor(@Optional() @Self() public ngControl: NgControl, @Optional() @Self() public validator: Validators, private _elementRef: ElementRef) {
        if (this.ngControl != null) {
            this.ngControl.valueAccessor = this;
        }
    }

    // event fired when input value is changed . later propagated up to the form control using the custom value accessor interface
    public onChange(value: T | string | undefined) {
        //set changed value
        this.innerValue = value;
        // propagate value into form control using control value accessor interface
        this.propagateChange(this.innerValue);

        //reset errors
        this.errors = [];
        //setting, resetting error messages into an array (to loop) and adding the validation messages to show below the field area
        for (var key in this.form_control.errors) {
            if (this.form_control.errors.hasOwnProperty(key)) {
                this.errors.push(this.form_control.errors[key]);
            }
        }
    }

    get errorState(): boolean {
        return this.form_control.invalid && this.touched;
    }

    //get accessor
    public get value(): T | string | undefined {
        return this.innerValue;
    };

    //set accessor including call the onchange callback
    public set value(v: T | string | undefined) {
        if (v !== this.innerValue) {
            this.stateChanges.next();
            this.innerValue = v;
        }
    }

    public setDescribedByIds(ids: string[]) {
        const controlElement = this._elementRef.nativeElement.querySelector('.mho-select-input-container')!;
        if (controlElement) {
            controlElement.setAttribute('aria-describedby', ids.join(' '));
        }
    }

    public onContainerClick(event: MouseEvent) {
        if (this.filter_input) {
            this.filter_input.focus();
        }
    }

    public filter(event: Event) {
        const value: string = (<HTMLInputElement>event.target)?.value?.toLowerCase();
        this.displayed_options = [...this.complete_options.filter((option: T | string) => {
            const label: string = this.label_pipe.transform(option, this.bindLabel);
            return label.toLowerCase().indexOf(value) > -1;
        })]
    }

    //From ControlValueAccessor interface
    public writeValue(value: T | string | undefined) {
        this.innerValue = value;
        this.onChange(value)
    }

    //From ControlValueAccessor interface
    public registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    //From ControlValueAccessor interface
    public registerOnTouched(fn: any) {

    }

    public onFocusIn(event: FocusEvent) {
        if (!this.focused) {
            this.focused = true;
            this.stateChanges.next();
        }
    }

    public onFocusOut(event: FocusEvent) {
        if (!this._elementRef.nativeElement.contains(event.relatedTarget as Element)) {
            this.touched = true;
            this.focused = false;
            this.onTouched();
            this.stateChanges.next();
        }
    }

    public get empty() {
        return !this.value;
    }

    public validate(control: AbstractControl): ValidationErrors | null {
        const quantity = control.value;
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

