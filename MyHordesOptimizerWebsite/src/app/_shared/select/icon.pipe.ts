import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'icon'
})
export class IconPipe<T> implements PipeTransform {
    transform(object: string | T, bind_icon: string | undefined): string {
        if (!bind_icon || bind_icon === '') return <string>object;
        if (!object || object === '') return '';

        const icon_levels: string[] = bind_icon.split('.');
        let final_icon: string | Record<string, unknown> = object;
        icon_levels.forEach((level: string) => {
            if (typeof final_icon !== 'string') {
                if (final_icon[level]) {
                    final_icon = <string | Record<string, unknown>>final_icon[level];
                } else {
                    final_icon = '';
                }
            }
        });
        return final_icon.toString() ?? '';
    }
}
