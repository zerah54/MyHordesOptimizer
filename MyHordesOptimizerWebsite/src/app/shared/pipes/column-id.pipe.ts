import { Pipe, PipeTransform } from '@angular/core';
import { StandardColumn } from '../../_abstract_model/interfaces';


@Pipe({
    name: 'ids',
    pure: false,
    standalone: true
})
export class ColumnIdPipe implements PipeTransform {
    transform(columns: StandardColumn[]): string[] {
        return columns
            .filter((column: StandardColumn) => !column.displayed || column.displayed())
            .map((column: StandardColumn): string => column.id);
    }
}
