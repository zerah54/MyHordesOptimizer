import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'label',
    standalone: true,
})
export class LabelPipe<T> implements PipeTransform {
    transform(object: string | T, bind_label: string): string {
        if (!bind_label) return <string>object;

        const label_levels: string[] = bind_label.split('.');
        let final_label: any = object;
        label_levels.forEach((level: string) => {
            final_label = final_label[level];
        });
        return final_label;
    }
}

@Pipe({
    name: 'multipleLabel',
    standalone: true,
})
export class MultipleLabelPipe<T> implements PipeTransform {
    transform(objects: string[] | T[], bind_label: string): string[] {
        if (!bind_label) return <string[]>objects;

        const label_levels: string[] = bind_label.split('.');
        const final_objects: string[] = objects.map((object: string | T) => {
            let final_label: any = object;
            label_levels.forEach((level: string) => {
                final_label = final_label[level];
            });
            return final_label;
        });
        console.log('final', final_objects);
        return final_objects;
    }
}
