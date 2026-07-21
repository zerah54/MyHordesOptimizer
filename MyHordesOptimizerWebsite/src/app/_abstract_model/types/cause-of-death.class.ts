import moment from 'moment';

import { CauseOfDeathDTO } from '../dto/cause-of-death.dto';
import { CommonModel } from './_common.class';
import { Dictionary } from './_types';

export class CauseOfDeath extends CommonModel<CauseOfDeathDTO> {
    public dtype!: number;
    public ref?: string;
    public icon?: string;
    public label?: Dictionary<string>;
    public description?: Dictionary<string>;

    constructor(dto?: CauseOfDeathDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): CauseOfDeathDTO {
        return {
            dtype: this.dtype,
            ref: this.ref,
            icon: this.icon,
            label: this.label,
            description: this.description,
        };
    }

    /** Libellé localisé de la cause de mort, en nettoyant les libellés au format ICU. */
    public getLabel(): string {
        return this.getLocalized(this.label);
    }

    /** Description localisée de la cause de mort, en nettoyant les descriptions au format ICU. */
    public getDescription(): string {
        return this.getLocalized(this.description);
    }

    protected dtoToModel(dto?: CauseOfDeathDTO): void {
        if (dto) {
            this.dtype = dto.dtype;
            this.ref = dto.ref;
            this.icon = dto.icon;
            this.label = dto.label;
            this.description = dto.description;
        }
    }

    private getLocalized(source?: Dictionary<string>): string {
        const locale: string = moment.locale();
        const raw: string = source?.[locale] ?? source?.['fr'] ?? this.ref ?? '';
        return CauseOfDeath.cleanIcu(raw);
    }

    /**
     * Certains libellés/descriptions MyHordes sont au format ICU MessageFormat
     * (`{ref__icu, select, ... other {...}}`, parfois imbriqué pour le genre).
     * On extrait la dernière branche `other {...}` feuille (le texte non genré) ;
     * un libellé simple est renvoyé tel quel.
     */
    private static cleanIcu(raw: string): string {
        if (!raw) return '';
        if (!raw.includes('select,')) return raw.trim();
        let best: string = '';
        const regex: RegExp = /other\s*\{/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(raw)) !== null) {
            const start: number = match.index + match[0].length;
            let depth: number = 1;
            let index: number = start;
            while (index < raw.length && depth > 0) {
                if (raw[index] === '{') depth++;
                else if (raw[index] === '}') {
                    depth--;
                    if (depth === 0) break;
                }
                index++;
            }
            const content: string = raw.substring(start, index).trim();
            if (!content.includes('{')) best = content;
        }
        return best || raw.replace(/\s+/g, ' ').trim();
    }
}
