import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'label',
    standalone: true,
})
export class LabelPipe<T> implements PipeTransform {
    transform(object: string | T, bind_label: string): string {
        console.log('bindlabel', bind_label);
        if (!bind_label) return <string>object;

        const label_levels: string[] = bind_label.split('.');
        console.log('label_levels', label_levels);
        let final_label: any = object;
        label_levels.forEach((level: string) => {
            final_label = final_label[level];
        });
        console.log('final_label', final_label);
        return final_label;
    }
}
