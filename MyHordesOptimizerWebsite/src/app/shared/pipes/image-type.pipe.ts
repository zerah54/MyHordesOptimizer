import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'imageType',
})
export class ImageTypePipe implements PipeTransform {
    transform(src: string): 'avif' | 'webp' | 'img' {
        if (src.endsWith('.avif')) return 'avif';
        if (src.endsWith('.webp')) return 'webp';

        return 'img';
    }
}
