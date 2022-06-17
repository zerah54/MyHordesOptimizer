import { AfterViewInit, Component, forwardRef, Input, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSelect } from '@angular/material/select';

@Component({
    selector: 'mho-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        multi: true,
        useExisting: forwardRef(() => SelectComponent)
    }],
})
export class SelectComponent<T> implements ControlValueAccessor, AfterViewInit {

    // get reference to the input element
    @ViewChild(MatSelect) select!: MatSelect;

    @Input() multiple: boolean = false;
    @Input() bindLabel!: string;
    //current form control input. helpful in validating and accessing form control
    @Input() form_control: AbstractControl = new FormControl();


    @Input() set options(options: (T | string)[]) {
        this.displayed_options = [...options];
        this.complete_options = [...options];
    };

    public displayed_options: (T | string)[] = [];

    private complete_options: (T | string)[] = [];
    //The internal data model for form control value access
    private innerValue: T | string | undefined = undefined;
    // errors for the form control will be stored in this array
    private errors: string[] = ['This field is required'];

    //propagate changes into the custom form control
    public propagateChange = (_: any) => { }


    public ngAfterViewInit(): void {
        // RESET the custom input form control UI when the form control is RESET
        this.form_control.valueChanges.subscribe(
            () => {
                // check condition if the form control is RESET
                if (this.form_control.value === '' || !this.form_control.value) {
                    this.innerValue = undefined;
                    this.select.value = undefined;
                }
            }
        );
    }
    // event fired when input value is changed . later propagated up to the form control using the custom value accessor interface
    public onChange(event: Event, value: T | string) {
        //set changed value
        this.innerValue = value;
        // propagate value into form control using control value accessor interface
        this.propagateChange(this.innerValue);

        //reset errors
        this.errors = [];
        //setting, resetting error messages into an array (to loop) and adding the validation messages to show below the field area
        for (var key in this.form_control.errors) {
            if (this.form_control.errors.hasOwnProperty(key)) {
                if (key === "required") {
                    this.errors.push("This field is required");
                } else {
                    this.errors.push(this.form_control.errors[key]);
                }
            }
        }
    }

    //get accessor
    public get value(): T | string | undefined {
        return this.innerValue;
    };

    //set accessor including call the onchange callback
    public set value(v: T | string | undefined) {
        if (v !== this.innerValue) {
            this.innerValue = v;
        }
    }

    public filter(event: Event) {
        const value: string = (<HTMLInputElement>event.target)?.value.toLowerCase();
        this.displayed_options = [...this.complete_options.filter((option: T | string) => {
            return this.bindLabel ? (<string>option).toLowerCase().indexOf(value) > -1 : (<any>option)[this.bindLabel].toLowerCase().indexOf(value)
        })]
    }

    //From ControlValueAccessor interface
    public writeValue(value: any) {
        this.innerValue = value;
    }

    //From ControlValueAccessor interface
    public registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    //From ControlValueAccessor interface
    public registerOnTouched(fn: any) {

    }
}

