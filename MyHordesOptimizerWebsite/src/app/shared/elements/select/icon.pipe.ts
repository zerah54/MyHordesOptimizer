import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'icon',
    standalone: true,
})
export class IconPipe<T> implements PipeTransform {
    transform(object: string | T, bind_icon: string): string {
        if (!bind_icon || bind_icon === '') return <string>object;
        if (!object || object === '') return '';

        const icon_levels: string[] = bind_icon.split('.');
        let final_icon: any = object;
        icon_levels.forEach((level: string) => {
            final_icon = final_icon[level];
        });
        return final_icon ?? '';
    }
}
