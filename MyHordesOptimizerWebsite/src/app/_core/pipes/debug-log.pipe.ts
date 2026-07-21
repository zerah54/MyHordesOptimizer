import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'debugLog'
})
export class DebugLogPipe implements PipeTransform {

    public transform(...to_log: unknown[]): void {
        console.log(...to_log);
    }

}
