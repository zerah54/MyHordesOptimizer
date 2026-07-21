import { inject,Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('json', json);

@Pipe({
    name: 'highlightJson',
})
export class HighlightJsonPipe implements PipeTransform {
    private readonly sanitizer: DomSanitizer = inject(DomSanitizer);

    public transform(value: string | null | undefined): SafeHtml {
        if (!value) return '';
        try {
            const formatted: string = JSON.stringify(JSON.parse(value), null, 2);
            return this.sanitizer.bypassSecurityTrustHtml(
                hljs.highlight(formatted, { language: 'json' }).value
            );
        } catch {
            return value;
        }
    }
}
