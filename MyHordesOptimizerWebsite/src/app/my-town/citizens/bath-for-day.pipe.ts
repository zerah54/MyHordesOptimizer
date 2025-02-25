import { Pipe, PipeTransform } from '@angular/core';
import { Bath } from '../../_abstract_model/types/bath.class';

@Pipe({
    name: 'bathForDay'
})
export class BathForDayPipe implements PipeTransform {
    transform(baths: Bath[], day: number): Bath | undefined {
        if (!baths || baths.length === 0) return undefined;
        return baths.find((bath: Bath) => bath.day === day && bath.update_info);
    }
}
