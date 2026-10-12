import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';

import { MapRouteRequestDTO } from '../../../_abstract_model/dto/map-route.dto';
import { isHubConflictError } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import {
    MAP_ROUTE_COLORS,
    MapRoute,
    MapRouteColor,
    MapRoutePoint,
    MapRouteStop,
    MapRouteStopMode,
    toMapRoutePointDto,
    toMapRouteStopDto
} from '../../../_abstract_model/types/map-route.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { cellsByCoordinates } from './map-route-detail';
import { MapRouteDrawing } from './map-route-views';
import { MapRoutesStore } from './map-routes.store';
import { MapRouteKey, mapRouteKey } from './map-routes-display';
import { distanceInAp } from './route-geometry.util';
import { buildSegments, CellIndex, countFresh, pointKeys, routeCells, RouteSegment, samePoint, segmentPath, splitSegments } from './route-path.util';

/** Longueur maximale du nom d'un tracé (`MapRoutePath.MaxLabelLength` côté API). */
export const MAP_ROUTE_LABEL_MAX_LENGTH: number = 64;

/** Changements du chemin qu'« Annuler » peut défaire. */
const MAX_UNDO: number = 100;

/** Départ et chemin tels qu'« Annuler » les rétablit. */
interface PathSnapshot {
    readonly start: MapRoutePoint | null;
    readonly segments: readonly RouteSegment[];
}

/** Tracé en cours de saisie. */
export interface MapRouteDraft {
    /** `null` : nouveau tracé. */
    readonly id: number | null;
    /** Version lue au début de la modification, renvoyée à l'enregistrement. */
    readonly version: number | null;
    readonly label: string;
    readonly color: MapRouteColor;
    readonly is_private: boolean;
    readonly is_editable_by_all: boolean;
    readonly shared_user_ids: readonly number[];
    /** Auteur d'un tracé existant (exclu des autorisations) ; `null` pour un nouveau tracé. */
    readonly author_id: number | null;
    /** Lié à une partie d'expédition : il reste visible de toute la ville. */
    readonly is_linked: boolean;
    /** `null` : départ pas encore choisi (nouveau tracé). */
    readonly start: MapRoutePoint | null;
    readonly segments: readonly RouteSegment[];
}

/** Segment fantôme vers la case survolée (ou touchée une première fois). */
export interface MapRoutePreview {
    readonly target: MapRoutePoint;
    /** Depuis la dernière case du tracé. */
    readonly cells: readonly MapRoutePoint[];
    readonly ap: number;
    /** Cases non épuisées que le segment ajouterait au tracé. */
    readonly fresh: number;
}

export type MapRouteEditorStatus = 'idle' | 'saving' | 'error';

/**
 * Le tracé modifié, tel que la ville le connaît maintenant : inchangé, modifié entre-temps par quelqu'un
 * d'autre (version plus récente), ou disparu (supprimé, ou plus visible).
 */
export type MapRouteRemoteState = 'same' | 'changed' | 'gone';

function randomColor(): MapRouteColor {
    return MAP_ROUTE_COLORS[Math.floor(Math.random() * MAP_ROUTE_COLORS.length)];
}

function previewLabel(preview: MapRoutePreview): string {
    return preview.fresh > 1
        ? $localize`+${preview.ap}:ap: PA · ${preview.fresh}:fresh: non épuisées`
        : $localize`+${preview.ap}:ap: PA · ${preview.fresh}:fresh: non épuisée`;
}

/**
 * Saisie d'un tracé sur la carte : un clic = une destination, le chemin s'y rend par les plus courts chemins
 * au meilleur potentiel (ou en L). Fourni par la carte : l'état vit le temps de la page.
 */
@Injectable()
export class MapRouteEditor {
    private readonly routes_store: MapRoutesStore = inject(MapRoutesStore);

    private readonly town: WritableSignal<MapRoutePoint | null> = signal(null);
    private readonly cell_index: WritableSignal<CellIndex> = signal(new Map());
    private readonly draft_state: WritableSignal<MapRouteDraft | null> = signal(null);
    private readonly mode_state: WritableSignal<MapRouteStopMode> = signal('best');
    private readonly status_state: WritableSignal<MapRouteEditorStatus> = signal('idle');
    private readonly hovered: WritableSignal<MapRoutePoint | null> = signal(null);
    /** Écran tactile : case touchée une première fois, en aperçu, validée par un second toucher. */
    private readonly armed: WritableSignal<MapRoutePoint | null> = signal(null);
    /** Chemins précédents, le plus récent en dernier : « Annuler » défait le dernier changement du chemin. */
    private readonly history: WritableSignal<readonly PathSnapshot[]> = signal([]);
    /** Brouillon tel qu'au début de la saisie : sans changement, quitter ne demande rien. */
    private initial: MapRouteDraft | null = null;

    public readonly draft: Signal<MapRouteDraft | null> = this.draft_state.asReadonly();
    public readonly mode: Signal<MapRouteStopMode> = this.mode_state.asReadonly();
    public readonly status: Signal<MapRouteEditorStatus> = this.status_state.asReadonly();

    public readonly editing: Signal<boolean> = computed((): boolean => this.draft_state() !== null);

    /** Clé du tracé modifié : la carte ne le dessine pas une seconde fois. */
    public readonly editing_key: Signal<MapRouteKey | null> = computed((): MapRouteKey | null => {
        const id: number | null | undefined = this.draft_state()?.id;
        return id === null || id === undefined ? null : mapRouteKey('mho', id);
    });

    public readonly cells: Signal<readonly MapRoutePoint[]> = computed((): readonly MapRoutePoint[] => {
        const draft: MapRouteDraft | null = this.draft_state();
        return draft?.start ? routeCells(draft.start, draft.segments) : [];
    });

    public readonly length: Signal<number> = computed((): number => Math.max(0, this.cells().length - 1));

    /** Cases du tracé saisi (« x,y ») : celles où un clic droit ou un appui long coupe le tracé. */
    public readonly cell_keys: Signal<ReadonlySet<string>> = computed((): ReadonlySet<string> => pointKeys(this.cells()));

    public readonly can_undo: Signal<boolean> = computed((): boolean => this.history().length > 0);

    public readonly fresh: Signal<number> = computed((): number => countFresh(this.cells(), this.cell_index()));

    /** PA pour rentrer en ville depuis la dernière case ; 0 pour une boucle. */
    public readonly return_ap: Signal<number> = computed((): number => {
        const town: MapRoutePoint | null = this.town();
        const cells: readonly MapRoutePoint[] = this.cells();
        return town && cells.length ? distanceInAp(cells[cells.length - 1], town) : 0;
    });

    public readonly is_dirty: Signal<boolean> = computed((): boolean => {
        const draft: MapRouteDraft | null = this.draft_state();
        return draft !== null && draft !== this.initial;
    });

    public readonly label_valid: Signal<boolean> = computed((): boolean => {
        const label: string = this.draft_state()?.label.trim() ?? '';
        return label.length > 0 && label.length <= MAP_ROUTE_LABEL_MAX_LENGTH;
    });

    public readonly can_save: Signal<boolean> = computed((): boolean => {
        return this.draft_state() !== null && this.label_valid() && this.cells().length >= 2 && this.status_state() !== 'saving';
    });

    /** Version du tracé modifié que la ville connaît maintenant ; `null` pour un nouveau tracé ou s'il a disparu. */
    public readonly remote_route: Signal<MapRoute | null> = computed((): MapRoute | null => {
        const id: number | null | undefined = this.draft_state()?.id;
        if (id === null || id === undefined) return null;
        return this.routes_store.routes().find((route: MapRoute): boolean => route.id === id) ?? null;
    });

    public readonly remote_state: Signal<MapRouteRemoteState> = computed((): MapRouteRemoteState => {
        const draft: MapRouteDraft | null = this.draft_state();
        if (!draft || draft.id === null) return 'same';
        const remote: MapRoute | null = this.remote_route();
        if (!remote) return this.routes_store.status() === 'loaded' ? 'gone' : 'same';
        return remote.version > (draft.version ?? 0) ? 'changed' : 'same';
    });

    public readonly preview: Signal<MapRoutePreview | null> = computed((): MapRoutePreview | null => {
        const target: MapRoutePoint | null = this.armed() ?? this.hovered();
        const cells: readonly MapRoutePoint[] = this.cells();
        if (!target || cells.length === 0 || this.status_state() === 'saving') return null;
        const last: MapRoutePoint = cells[cells.length - 1];
        if (samePoint(last, target)) return null;
        const used: Set<string> = pointKeys(cells);
        const path: MapRoutePoint[] = segmentPath(last, target, this.mode_state(), used, this.cell_index());
        return { target, cells: [last, ...path], ap: path.length, fresh: countFresh(path, this.cell_index(), used) };
    });

    /** Le tracé saisi, puis l'aperçu du prochain segment. */
    public readonly drawings: Signal<MapRouteDrawing[]> = computed((): MapRouteDrawing[] => {
        const draft: MapRouteDraft | null = this.draft_state();
        if (!draft) return [];
        const drawings: MapRouteDrawing[] = [];
        const cells: readonly MapRoutePoint[] = this.cells();
        if (cells.length > 0) {
            drawings.push({
                key: 'draft', color: draft.color, cells, lane: 0, dashed: false, emphasized: true, dimmed: false, label: null
            });
        }
        const preview: MapRoutePreview | null = this.preview();
        if (preview) {
            drawings.push({
                key: 'preview', color: draft.color, cells: preview.cells, lane: 0, dashed: true, emphasized: false, dimmed: false,
                label: previewLabel(preview)
            });
        }
        return drawings;
    });

    /** Carte affichée : ville (destination du retour) et potentiel des cases. */
    public setMap(town: Town | undefined): void {
        this.town.set(town ? { x: town.town_x, y: town.town_y } : null);
        this.cell_index.set(cellsByCoordinates(town));
    }

    /** Nouveau tracé, sans départ : la première case choisie sur la carte le fixe. */
    public startNew(): void {
        this.begin({
            id: null, version: null, label: '', color: randomColor(), is_private: false, is_editable_by_all: true,
            shared_user_ids: [], author_id: null, is_linked: false, start: null, segments: []
        });
    }

    /** Modifie un tracé existant : son chemin est repris tel quel, sans recalcul. */
    public startEdit(route: MapRoute): void {
        const start: MapRoutePoint | null = route.cells[0] ?? this.town();
        if (!start) return;
        const segments: RouteSegment[] = splitSegments(route.cells, route.stops) ?? buildSegments(start, route.stops, this.cell_index());
        this.begin({
            id: route.id, version: route.version, label: route.label, color: route.color, is_private: route.is_private,
            is_editable_by_all: route.is_editable_by_all, shared_user_ids: [...route.shared_user_ids], author_id: route.author_id,
            is_linked: route.linked_parts.length > 0, start, segments
        });
    }

    /** Quitte la saisie sans enregistrer. */
    public cancel(): void {
        this.draft_state.set(null);
        this.history.set([]);
        this.initial = null;
        this.hovered.set(null);
        this.armed.set(null);
        this.status_state.set('idle');
    }

    public setMode(mode: MapRouteStopMode): void {
        this.mode_state.set(mode);
    }

    public setLabel(label: string): void {
        this.update((draft: MapRouteDraft): MapRouteDraft => ({ ...draft, label }));
    }

    /** Un tracé lié à une expédition reste visible de toute la ville. */
    public setPrivate(is_private: boolean): void {
        this.update((draft: MapRouteDraft): MapRouteDraft => draft.is_linked && is_private ? draft : { ...draft, is_private });
    }

    public setEditableByAll(is_editable_by_all: boolean): void {
        this.update((draft: MapRouteDraft): MapRouteDraft => ({ ...draft, is_editable_by_all }));
    }

    public addShare(user_id: number): void {
        this.update((draft: MapRouteDraft): MapRouteDraft => {
            if (draft.shared_user_ids.includes(user_id) || user_id === draft.author_id) return draft;
            return { ...draft, shared_user_ids: [...draft.shared_user_ids, user_id] };
        });
    }

    public removeShare(user_id: number): void {
        this.update((draft: MapRouteDraft): MapRouteDraft => ({
            ...draft,
            shared_user_ids: draft.shared_user_ids.filter((known: number): boolean => known !== user_id)
        }));
    }

    /** Case survolée à la souris : aperçu du segment qui y mènerait. */
    public hover(point: MapRoutePoint | null): void {
        const current: MapRoutePoint | null = this.hovered();
        if (current === point || (current && point && samePoint(current, point))) return;
        this.hovered.set(point);
    }

    /**
     * Case choisie sur la carte. À la souris, elle devient la prochaine destination. Au toucher, un premier
     * toucher montre l'aperçu, un second sur la même case la valide. Tant que le départ n'est pas choisi, la case
     * le devient aussitôt : il n'y a pas encore de chemin à prévisualiser.
     */
    public pick(point: MapRoutePoint, touch: boolean): void {
        if (!this.isEditable()) return;
        if (this.draft_state()?.start === null) {
            this.update((draft: MapRouteDraft): MapRouteDraft => ({ ...draft, start: { x: point.x, y: point.y } }));
            return;
        }
        const armed: MapRoutePoint | null = this.armed();
        if (touch && !(armed && samePoint(armed, point))) {
            this.armed.set(point);
            return;
        }
        this.armed.set(null);
        this.addStop(point);
    }

    /** Ajoute une destination, rejointe selon le mode choisi. */
    public addStop(point: MapRoutePoint): void {
        const mode: MapRouteStopMode = this.mode_state();
        const cells: CellIndex = this.cell_index();
        this.updatePath((draft: MapRouteDraft): readonly RouteSegment[] => {
            if (!draft.start) return draft.segments;
            const route: MapRoutePoint[] = routeCells(draft.start, draft.segments);
            const last: MapRoutePoint = route[route.length - 1];
            if (samePoint(last, point)) return draft.segments;
            const path: MapRoutePoint[] = segmentPath(last, point, mode, pointKeys(route), cells);
            return [...draft.segments, { stop: { x: point.x, y: point.y, mode }, cells: path }];
        });
    }

    /**
     * Coupe le tracé au premier passage par cette case : tout ce qui suit est retiré, même un passage ultérieur
     * par la même case, et elle devient l'arrivée (avec le mode du segment coupé). Le départ efface tout. Sans
     * effet sur une case hors du tracé ou sur l'arrivée.
     */
    public cutAt(point: MapRoutePoint): void {
        this.armed.set(null);
        this.updatePath((draft: MapRouteDraft): readonly RouteSegment[] => {
            if (!draft.start) return draft.segments;
            if (samePoint(draft.start, point)) return draft.segments.length ? [] : draft.segments;
            for (let index: number = 0; index < draft.segments.length; index++) {
                const segment: RouteSegment = draft.segments[index];
                const position: number = segment.cells.findIndex((cell: MapRoutePoint): boolean => samePoint(cell, point));
                if (position < 0) continue;
                if (index === draft.segments.length - 1 && position === segment.cells.length - 1) return draft.segments;
                const cut: RouteSegment = { stop: { x: point.x, y: point.y, mode: segment.stop.mode }, cells: segment.cells.slice(0, position + 1) };
                return [...draft.segments.slice(0, index), cut];
            }
            return draft.segments;
        });
    }

    /** Défait le dernier changement du chemin (ajout, coupe, effacement, recalcul). */
    public undo(): void {
        this.armed.set(null);
        const history: readonly PathSnapshot[] = this.history();
        if (history.length === 0 || !this.isEditable()) return;
        const previous: PathSnapshot = history[history.length - 1];
        this.history.set(history.slice(0, -1));
        this.update((draft: MapRouteDraft): MapRouteDraft => ({ ...draft, start: previous.start, segments: previous.segments }));
    }

    /** Efface le départ et toutes les destinations : le départ est à choisir de nouveau. */
    public clear(): void {
        this.armed.set(null);
        const draft: MapRouteDraft | null = this.draft_state();
        if (!draft?.start || !this.isEditable()) return;
        this.remember(draft);
        this.update((current: MapRouteDraft): MapRouteDraft => ({ ...current, start: null, segments: [] }));
    }

    /** Mêmes destinations, chemin recalculé avec le potentiel du jour. */
    public recalculate(): void {
        const cells: CellIndex = this.cell_index();
        this.updatePath((draft: MapRouteDraft): readonly RouteSegment[] => {
            if (!draft.start) return draft.segments;
            return buildSegments(draft.start, draft.segments.map((segment: RouteSegment): MapRouteStop => segment.stop), cells);
        });
    }

    /**
     * Enregistre le tracé et quitte la saisie. Refus pour version périmée : le tracé est relu, et
     * `remote_state` passe à « modifié » ou « disparu » pour que l'utilisateur choisisse. Un tracé disparu est
     * recréé.
     *
     * @returns le tracé enregistré, `null` en cas d'échec
     */
    public async save(): Promise<MapRoute | null> {
        const draft: MapRouteDraft | null = this.draft_state();
        if (!draft || !this.can_save()) return null;
        this.status_state.set('saving');
        this.armed.set(null);
        try {
            const saved: MapRoute = await this.routes_store.saveRoute(this.toRequest(draft));
            this.cancel();
            return saved;
        } catch (error: unknown) {
            this.status_state.set(await this.statusAfterFailure(draft, error));
            return null;
        }
    }

    /** Tracé modifié entre-temps : garde ma version, enregistrée par-dessus la leur. */
    public async keepMine(): Promise<MapRoute | null> {
        const remote: MapRoute | null = this.remote_route();
        if (!remote || this.status_state() === 'saving') return null;
        this.draft_state.update((draft: MapRouteDraft | null): MapRouteDraft | null => draft ? { ...draft, version: remote.version } : draft);
        return this.save();
    }

    /** Tracé modifié entre-temps : abandonne ma version pour reprendre la leur. */
    public takeTheirs(): void {
        const remote: MapRoute | null = this.remote_route();
        if (remote && this.status_state() !== 'saving') {
            this.startEdit(remote);
        }
    }

    private begin(draft: MapRouteDraft): void {
        this.initial = draft;
        this.draft_state.set(draft);
        this.history.set([]);
        this.hovered.set(null);
        this.armed.set(null);
        this.status_state.set('idle');
    }

    private isEditable(): boolean {
        return this.draft_state() !== null && this.status_state() !== 'saving';
    }

    private update(change: (draft: MapRouteDraft) => MapRouteDraft): void {
        const draft: MapRouteDraft | null = this.draft_state();
        if (!draft || this.status_state() === 'saving') return;
        const next: MapRouteDraft = change(draft);
        if (next === draft) return;
        this.draft_state.set(next);
        if (this.status_state() === 'error') {
            this.status_state.set('idle');
        }
    }

    /** Change le chemin en gardant le précédent pour « Annuler ». Renvoyer les segments actuels : rien ne change. */
    private updatePath(change: (draft: MapRouteDraft) => readonly RouteSegment[]): void {
        const draft: MapRouteDraft | null = this.draft_state();
        if (!draft || !this.isEditable()) return;
        const segments: readonly RouteSegment[] = change(draft);
        if (segments === draft.segments) return;
        this.remember(draft);
        this.update((current: MapRouteDraft): MapRouteDraft => ({ ...current, segments }));
    }

    /** Garde le départ et le chemin actuels pour « Annuler ». */
    private remember(draft: MapRouteDraft): void {
        this.history.update((history: readonly PathSnapshot[]): readonly PathSnapshot[] => {
            return [...history.slice(-(MAX_UNDO - 1)), { start: draft.start, segments: draft.segments }];
        });
    }

    private toRequest(draft: MapRouteDraft): MapRouteRequestDTO {
        // Tracé disparu entre-temps : l'enregistrer le recrée.
        const recreate: boolean = this.remote_state() === 'gone';
        return {
            id: recreate ? null : draft.id,
            version: recreate ? null : draft.version,
            label: draft.label.trim(),
            color: draft.color,
            isPrivate: draft.is_private,
            isEditableByAll: draft.is_editable_by_all,
            sharedUserIds: draft.is_private ? [...draft.shared_user_ids] : [],
            cells: this.cells().map(toMapRoutePointDto),
            stops: draft.segments.map((segment: RouteSegment): MapRouteStop => segment.stop).map(toMapRouteStopDto)
        };
    }

    private async statusAfterFailure(draft: MapRouteDraft, error: unknown): Promise<MapRouteEditorStatus> {
        if (!isHubConflictError(error) || draft.id === null) return 'error';
        try {
            await this.routes_store.reloadRoute(draft.id);
        } catch {
            return 'error';
        }
        // Relu sans écart : le refus ne s'explique pas, on le signale comme une erreur.
        return this.remote_state() === 'same' ? 'error' : 'idle';
    }
}
