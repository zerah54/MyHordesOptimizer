import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'trashLevel',
    standalone: true,
})
export class TrashLevelPipe implements PipeTransform {
    transform(trash_number: number): number {
        if (trash_number === 0) return 0;
        if (trash_number <= 4) return 1;
        if (trash_number <= 8) return 2;
        return 3;
    }
}
