import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'label'
})
export class LabelPipe<T> implements PipeTransform {
    public transform(object: string | T, bind_label: string | undefined): string {
        if (!bind_label) return <string>object;

        const label_levels: string[] = bind_label.split('.');
        let final_label: string | T = object;
        label_levels.forEach((level: string) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            final_label = final_label[level];
        });
        return final_label as string;
    }
}

@Pipe({
    name: 'multipleLabel'
})
export class MultipleLabelPipe<T> implements PipeTransform {
    public transform(objects: string[] | T[], bind_label: string | undefined): string[] {
        if (!bind_label) return <string[]>objects;

        const label_levels: string[] = bind_label.split('.');
        const final_objects: string[] = objects.map((object: string | T) => {
            let final_label: string | T = object;
            label_levels.forEach((level: string) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                final_label = final_label[level];
            });
            return final_label as string;
        });
        return final_objects;
    }
}
