import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, OnInit, Signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DataSet, DataView } from 'vis-data/peer';
import { ChosenLabelValues, Data, EdgeOptions, IdType, Network, NodeOptions, Options } from 'vis-network/peer';

import { Imports } from '../../_abstract_model/types/_types';
import { ChartsThemingService } from '../../_core/services/charts-theming.service';
import { ThemeService } from '../../_core/services/theme.service';
import { SelectComponent } from '../../_shared/select/select.component';
import { IrlLink, links } from './irl-links.const';
import { IrlPeople, people } from './irl-people.const';
import { IrlTowns, TownId, towns } from './irl-towns.const';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [SelectComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule, MatFormFieldModule];

@Component({
    selector: 'mho-irl',
    templateUrl: './irl.component.html',
    styleUrls: ['./irl.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class IrlComponent implements OnInit {

    private readonly container: Signal<ElementRef> = viewChild.required<ElementRef>('hordiens');
    private readonly theme_service: ThemeService = inject(ThemeService);
    private readonly charts_theming: ChartsThemingService = inject(ChartsThemingService);

    private people: IrlPeople[] = people;
    private links: IrlLink[] = links;
    protected towns: IrlTowns[] = towns;

    private nodes: DataSet<IrlNode> = new DataSet(
        this.people.map((data: IrlPeople): IrlNode => {
            // Couleurs portées par les options globales du graphe (voir `nodeOptions`), pas par nœud :
            // un changement de thème ne touche alors qu'un objet d'options.
            return {
                id: data.id,
                label: data.id,
                towns: data.towns
            };
        })
    );

    private edges: DataSet<IrlEdge> = new DataSet(
        this.links.map((edge: IrlLink, index: number): IrlEdge => {
            // Famille et couple : liens réciproques et tiretés. La couleur vient du thème (`colorEdges`).
            const is_close: boolean = edge.type === 'famille' || edge.type === 'couple';
            return {
                id: index,
                from: edge.from,
                to: edge.to,
                type: edge.type,
                arrows: is_close ? 'from, to' : undefined,
                dashes: is_close ? true : undefined
            };
        })
    );

    private network: Network | null = null;

    protected selected_towns: IrlTowns[] = [...towns];

    protected nodes_view: DataView<IrlNode> = new DataView(
        this.nodes,
        { filter: (node: IrlNode) => node.towns.some((town: TownId): boolean => this.selected_towns.some((selected_town: IrlTowns): boolean => town === selected_town.id)) }
    );

    public constructor() {
        // Le graphe dessine sur un canevas et ne lit pas les variables CSS : ses couleurs sont
        // relues à chaque changement de famille ou de mode, puis repoussées au graphe déjà affiché.
        effect((): void => {
            this.theme_service.family();
            this.theme_service.is_dark();
            untracked((): void => this.applyPalette());
        });
    }

    public ngOnInit(): void {
        this.start();
    }

    private start(): void {
        const palette: IrlPalette = this.readPalette();
        this.colorEdges(palette);
        const data: Data = {
            nodes: this.nodes_view,
            edges: this.edges
        };
        const options: Options = {
            nodes: {
                shape: 'box',
                size: 20,
                ...this.nodeOptions(palette)
            },
            physics: {
                forceAtlas2Based: {
                    gravitationalConstant: -50,
                    centralGravity: 0.005,
                    springLength: 230,
                    springConstant: 0.18
                },
                maxVelocity: 146,
                solver: 'forceAtlas2Based',
                timestep: 0.35,
                stabilization: { iterations: 150 }
            }
        };

        this.network = new Network(this.container()?.nativeElement, data, options);
    }

    /** Recolore le graphe affiché. Avant sa création, `start()` lit lui-même la palette. */
    private applyPalette(): void {
        if (!this.network) {
            return;
        }
        const palette: IrlPalette = this.readPalette();
        this.colorEdges(palette);
        this.network.setOptions({ nodes: this.nodeOptions(palette) });
    }

    /** Jetons du design system, résolus en couleurs que le canevas sait dessiner. */
    private readPalette(): IrlPalette {
        return {
            surface: this.charts_theming.token('--mho-surface-2'),
            line: this.charts_theming.token('--mho-line-strong'),
            text: this.charts_theming.token('--mho-text'),
            accent: this.charts_theming.token('--mho-accent'),
            on_accent: this.charts_theming.token('--mho-on-accent'),
            family: this.charts_theming.token('--mho-accent-2'),
            couple: this.charts_theming.token('--mho-danger')
        };
    }

    /** Nœud : surface et filet du thème ; sélectionné, il passe sur l'accent, libellé compris. */
    private nodeOptions(palette: IrlPalette): NodeOptions {
        return {
            color: {
                background: palette.surface,
                border: palette.line,
                highlight: { background: palette.accent, border: palette.accent }
            },
            font: { color: palette.text },
            chosen: {
                node: true,
                label: (values: ChosenLabelValues, _id: IdType, selected: boolean): void => {
                    if (selected) {
                        values.color = palette.on_accent;
                    }
                }
            }
        };
    }

    /** Lien simple sur le filet, famille sur `--mho-accent-2`, couple sur `--mho-danger`. */
    private colorEdges(palette: IrlPalette): void {
        this.edges.update(this.edges.get().map((edge: IrlEdge): Pick<IrlEdge, 'id' | 'color'> => {
            const color: string = edge.type === 'famille' ? palette.family : edge.type === 'couple' ? palette.couple : palette.line;
            return { id: edge.id, color: { color, highlight: color, hover: color, inherit: false } };
        }));
    }
}

interface IrlNode {
    id: string;
    label: string;
    towns: TownId[];
}

interface IrlEdge {
    id: number;
    from: string;
    to: string;
    type: IrlLink['type'];
    color?: EdgeOptions['color'];
    arrows: string | undefined;
    dashes: boolean | undefined;
}

/** Couleurs du graphe, lues dans les jetons du thème courant. */
interface IrlPalette {
    readonly surface: string;
    readonly line: string;
    readonly text: string;
    readonly accent: string;
    readonly on_accent: string;
    readonly family: string;
    readonly couple: string;
}
