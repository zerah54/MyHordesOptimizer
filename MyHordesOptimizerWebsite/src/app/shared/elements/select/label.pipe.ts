
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'label',
})
export class LabelPipe<T> implements PipeTransform {
    transform(object: string | T, bind_label: string): string {
        if (!bind_label) return <string>object;

        let label_levels: string[] = bind_label.split('.');
        let final_label: any = object;
        label_levels.forEach((level: string) => {
            final_label = final_label[level];
        })
        return final_label;
    }
}
