import { Pipe, PipeTransform } from '@angular/core';
import { getValueFromPropertyName } from '../../utilities/object.util';

@Pipe({
    name: 'bind'
})
export class BindPipe implements PipeTransform {
    transform<T>(value: T | T[], bind_value: string | undefined, options: T[]): unknown | unknown[] | undefined {
        if (!bind_value || !options) return value;
        if (Array.isArray(value)) {
            return value.map((solo_value: T) => {
                return options.find((option: unknown) => getValueFromPropertyName(option, bind_value) === solo_value);
            });
        } else {
            return options.find((option: T) => getValueFromPropertyName(option, bind_value) === value);
        }
    }
}

@Pipe({
    name: 'bindValue'
})
export class BindValuePipe implements PipeTransform {
    transform<T>(option: T, property_name: string | undefined): string | T | undefined {
        if (!property_name) return option;
        return getValueFromPropertyName(option, property_name);
    }
}
