import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'customKeyValue'
})
export class CustomKeyValuePipe<T> implements PipeTransform {
    transform(map: Map<string, T>): { key: string, value: T }[] {
        return Array.from(map.entries()).map((entry: [string, T]) => {
            return {
                key: entry[0],
                value: entry[1]
            };
        });
    }
}
