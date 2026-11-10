import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DataSet, DataView } from 'vis-data/peer';
import { Network } from 'vis-network/peer';

import { ChartsThemingService } from '../../_core/services/charts-theming.service';
import { ThemeService } from '../../_core/services/theme.service';
import { SelectComponent } from '../../_shared/select/select.component';
import { IrlComponent } from './irl.component';
import { IrlLink, links } from './irl-links.const';
import { IrlPeople, people } from './irl-people.const';
import { IrlTowns, towns } from './irl-towns.const';

interface IrlNodeForTest {
    id: string;
    towns: string[];
}

type CanvasMockModule = typeof import('vitest-canvas-mock');
type SavedProperties = Map<string, PropertyDescriptor | undefined>;

/** Ce que `vitest-canvas-mock` remplace, dès son import, sur le prototype des canvas et sur `window`. */
const CANVAS_PROTOTYPE_KEYS: readonly string[] = ['getContext', 'toBlob', 'toDataURL'];
const CANVAS_WINDOW_KEYS: readonly string[] = [
    'Path2D', 'CanvasGradient', 'CanvasPattern', 'CanvasRenderingContext2D', 'DOMMatrix', 'ImageData', 'TextMetrics', 'ImageBitmap', 'createImageBitmap'
];

/**
 * Relève des propriétés propres d'un objet.
 * @param {object} target Objet observé.
 * @param {readonly string[]} keys Propriétés à relever.
 * @returns {SavedProperties} Descripteurs, `undefined` pour une propriété absente.
 */
function saveProperties(target: object, keys: readonly string[]): SavedProperties {
    return new Map(keys.map((key: string): [string, PropertyDescriptor | undefined] => [key, Object.getOwnPropertyDescriptor(target, key)]));
}

/**
 * Remet des propriétés relevées par `saveProperties`, en supprimant celles qui n'existaient pas.
 * @param {object} target Objet à rétablir.
 * @param {SavedProperties} saved Relevé.
 */
function restoreProperties(target: object, saved: SavedProperties): void {
    saved.forEach((descriptor: PropertyDescriptor | undefined, key: string): void => {
        if (descriptor === undefined) {
            Reflect.deleteProperty(target, key);
        } else {
            Object.defineProperty(target, key, descriptor);
        }
    });
}

describe('IrlComponent', (): void => {
    let fixture: ComponentFixture<IrlComponent>;
    let component: IrlComponent;
    let canvas_mock: CanvasMockModule;
    let saved_prototype: SavedProperties;
    let saved_window: SavedProperties;

    // Les fichiers de test partagent leur environnement (Vitest non isolé) : le faux canvas, chargé à la demande puis
    // retiré, ne doit pas fuir vers les fichiers suivants (Chart.js y obtiendrait un contexte et exigerait ResizeObserver).
    beforeAll(async (): Promise<void> => {
        saved_prototype = saveProperties(HTMLCanvasElement.prototype, CANVAS_PROTOTYPE_KEYS);
        saved_window = saveProperties(window, CANVAS_WINDOW_KEYS);
        canvas_mock = await import('vitest-canvas-mock');
    });

    afterAll((): void => {
        restoreProperties(HTMLCanvasElement.prototype, saved_prototype);
        restoreProperties(window, saved_window);
    });

    beforeEach(async (): Promise<void> => {
        canvas_mock.setupVitestCanvasMock();
        await TestBed.configureTestingModule({
            imports: [IrlComponent]
        }).compileComponents();
        // Jeton → couleur factice reconnaissable : jsdom ne résout pas les variables CSS.
        vi.spyOn(TestBed.inject(ChartsThemingService), 'token').mockImplementation((name: string): string => `color(${name})`);
        fixture = TestBed.createComponent(IrlComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        // Le `[(ngModel)]` de mho-select écrit sa valeur initiale de façon différée (microtâche) :
        // on la laisse se résoudre ici (fixture encore vivante) pour ne pas la voir émettre après coup.
        // `fixture.whenStable()` n'est pas utilisable ici : le graphe vis-network programme sa propre
        // boucle de stabilisation physique (RAF/ResizeObserver), que la zone ne considère jamais stable.
        await Promise.resolve();
        await Promise.resolve();
    });

    afterEach((): void => {
        fixture.destroy();
        vi.restoreAllMocks();
        localStorage.removeItem('theme');
        localStorage.removeItem('theme-mode');
    });

    function nodesView(): DataView<IrlNodeForTest> {
        return (component as unknown as {
            nodes_view: DataView<IrlNodeForTest>;
        }).nodes_view;
    }

    function setSelectedTowns(selected: IrlTowns[]): void {
        (component as unknown as {
            selected_towns: IrlTowns[];
        }).selected_towns = selected;
    }

    function getSelectedTowns(): IrlTowns[] {
        return (component as unknown as {
            selected_towns: IrlTowns[];
        }).selected_towns;
    }

    function edgeColor(index: number): string | undefined {
        const edges: DataSet<{ id: number; color?: { color?: string } }> = (component as unknown as {
            edges: DataSet<{ id: number; color?: { color?: string } }>;
        }).edges;
        return edges.get(index)?.color?.color;
    }

    it('colours the links with the theme tokens, never with hard-coded colours', (): void => {
        const index_of: (type: IrlLink['type']) => number = (type: IrlLink['type']): number => links.findIndex((link: IrlLink): boolean => link.type === type);

        expect(edgeColor(index_of('couple'))).toBe('color(--mho-danger)');
        expect(edgeColor(index_of('famille'))).toBe('color(--mho-accent-2)');
        expect(edgeColor(index_of(undefined))).toBe('color(--mho-line-strong)');
    });

    it('re-reads the tokens and recolours the graph when the theme changes', (): void => {
        // Famille fixée : en saison, Halloween et Noël forcent le mode, qui ne changerait alors rien.
        const theme: ThemeService = TestBed.inject(ThemeService);
        theme.setPreference('brown');
        fixture.detectChanges();
        const set_options: ReturnType<typeof vi.spyOn> = vi.spyOn(Network.prototype, 'setOptions');
        vi.spyOn(TestBed.inject(ChartsThemingService), 'token').mockImplementation((name: string): string => `light(${name})`);

        theme.setMode(theme.is_dark() ? 'light' : 'dark');
        fixture.detectChanges();

        expect(set_options).toHaveBeenCalledWith({
            nodes: expect.objectContaining({
                color: expect.objectContaining({ background: 'light(--mho-surface-2)' }),
                font: { color: 'light(--mho-text)' }
            })
        });
        expect(edgeColor(links.findIndex((link: IrlLink): boolean => link.type === 'couple'))).toBe('light(--mho-danger)');
    });

    it('initializes without throwing and renders the graph canvas inside #hordiens', (): void => {
        const container: HTMLElement = fixture.debugElement.query(By.css('#hordiens')).nativeElement;
        expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('exposes the fixed towns list as select options', (): void => {
        expect((component as unknown as {
            towns: IrlTowns[];
        }).towns).toEqual(towns);
    });

    it('selects all towns by default (a copy, not the const array itself)', (): void => {
        const selected: IrlTowns[] = getSelectedTowns();
        expect(selected).toEqual(towns);
        expect(selected).not.toBe(towns);
    });

    it('wires the town filter select with the right options, label binding and multi/search mode', (): void => {
        const select: SelectComponent<IrlTowns> = fixture.debugElement.query(By.directive(SelectComponent)).componentInstance;
        expect(select.options()).toBe(towns);
        expect(select.bindLabel()).toBe('label');
        expect(select.multiple()).toBe(true);
        expect(select.searchable()).toBe(true);
    });

    it('includes every person as a node when all towns are selected', (): void => {
        expect(nodesView().length).toBe(people.length);
    });

    it('filters nodes down to people belonging to the selected towns after refresh()', (): void => {
        setSelectedTowns([towns.find((town: IrlTowns) => town.id === 'BB')!]);
        nodesView().refresh();

        const expectedIds: string[] = people
            .filter((person: IrlPeople) => person.towns.includes('BB'))
            .map((person: IrlPeople) => person.id)
            .sort();
        const actualIds: string[] = nodesView().get().map((node: IrlNodeForTest) => node.id).sort();
        expect(actualIds).toEqual(expectedIds);
    });

    it('does not reflect a narrowed selection until refresh() is called (DataView caches its filtered result)', (): void => {
        const before: number = nodesView().length;
        setSelectedTowns([towns.find((town: IrlTowns) => town.id === 'BB')!]);

        expect(nodesView().length).toBe(before);
    });

    it('re-applies the filter when the town select emits filterChange, per the template wiring', (): void => {
        const select: SelectComponent<IrlTowns> = fixture.debugElement.query(By.directive(SelectComponent)).componentInstance;
        setSelectedTowns([towns.find((town: IrlTowns) => town.id === 'BB')!]);

        select.filterChange.emit(undefined);

        const expectedCount: number = people.filter((person: IrlPeople) => person.towns.includes('BB')).length;
        expect(nodesView().length).toBe(expectedCount);
    });
});
