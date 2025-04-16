import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'min'
})
export class MinPipe implements PipeTransform {
    transform(numbers: number[]): number {
        return Math.min(...numbers);
    }
}

@Pipe({
    name: 'max'
})
export class MaxPipe implements PipeTransform {
    transform(numbers: number[]): number {
        return Math.max(...numbers);
    }
}
