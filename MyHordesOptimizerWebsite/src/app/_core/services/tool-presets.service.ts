import { Injectable } from '@angular/core';

import { TOOL_PRESETS_KEY_PREFIX } from '../../_abstract_model/const';

/** Configuration nommée d'un outil, telle que {@link ToolPresetsService} la range dans le `localStorage`. */
export interface ToolPreset {
    name: string;
    snapshot: Record<string, unknown>;
}

/** Presets nommés des outils (débordement, probabilités), propres au navigateur. */
@Injectable({ providedIn: 'root' })
export class ToolPresetsService {

    /** Presets de l'outil, dans l'ordre d'enregistrement ; vide si le stockage est absent ou corrompu. */
    public list(tool: string): ToolPreset[] {
        try {
            const stored: unknown = JSON.parse(localStorage.getItem(TOOL_PRESETS_KEY_PREFIX + tool) ?? '[]');
            return Array.isArray(stored) ? stored.filter((entry: unknown): entry is ToolPreset => this.isPreset(entry)) : [];
        } catch {
            return [];
        }
    }

    /** Enregistre (ou remplace, à sa place) le preset `name` ; `false` si le nom est vide ou le stockage refuse l'écriture. */
    public save(tool: string, name: string, snapshot: Record<string, unknown>): boolean {
        const trimmed: string = name.trim();
        if (trimmed === '') {
            return false;
        }
        const presets: ToolPreset[] = this.list(tool);
        const index: number = presets.findIndex((preset: ToolPreset): boolean => preset.name === trimmed);
        if (index === -1) {
            presets.push({ name: trimmed, snapshot });
        } else {
            presets[index] = { name: trimmed, snapshot };
        }
        return this.write(tool, presets);
    }

    /** Supprime le preset `name` s'il existe. */
    public delete(tool: string, name: string): void {
        this.write(tool, this.list(tool).filter((preset: ToolPreset): boolean => preset.name !== name));
    }

    private write(tool: string, presets: ToolPreset[]): boolean {
        try {
            localStorage.setItem(TOOL_PRESETS_KEY_PREFIX + tool, JSON.stringify(presets));
            return true;
        } catch {
            return false;
        }
    }

    private isPreset(entry: unknown): entry is ToolPreset {
        if (typeof entry !== 'object' || entry === null) {
            return false;
        }
        const candidate: Partial<ToolPreset> = entry;
        return typeof candidate.name === 'string'
            && typeof candidate.snapshot === 'object' && candidate.snapshot !== null && !Array.isArray(candidate.snapshot);
    }
}
