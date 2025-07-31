import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DataSet, DataView } from 'vis-data/peer';
import { Data, Network, Options } from 'vis-network/peer';
import { Imports } from '../../_abstract_model/types/_types';
import { SelectComponent } from '../../shared/elements/select/select.component';
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
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class IrlComponent implements OnInit {

    @ViewChild('hordiens', {static: true}) container!: ElementRef;

    public people: IrlPeople[] = people;
    public links: IrlLink[] = links;
    public towns: IrlTowns[] = towns;

    public nodes: DataSet<IrlNode> = new DataSet(
        this.people.map((data: IrlPeople): IrlNode => {
            return {
                id: data.id,
                label: data.id,
                color: {
                    background: 'white',
                    border: 'black'
                },
                towns: data.towns
            };
        })
    );

    public edges: DataSet<IrlEdge> = new DataSet(
        this.links.map((edge: IrlLink, index: number): IrlEdge => {
            let color: string;
            let arrows: string | undefined;
            let dashes: boolean | undefined;
            if (edge.type === 'famille') {
                color = 'blue';
                arrows = 'from, to';
                dashes = true;
            } else if (edge.type === 'couple') {
                color = 'red';
                arrows = 'from, to';
                dashes = true;
            } else {
                color = 'black';
            }
            return {
                id: index,
                from: edge.from,
                to: edge.to,
                color: color,
                arrows: arrows,
                dashes: dashes
            };
        })
    );

    public selected_towns: IrlTowns[] = [...towns];

    public nodes_view: DataView<IrlNode> = new DataView(
        this.nodes,
        {filter: (node: IrlNode) => node.towns.some((town: TownId): boolean => this.selected_towns.some((selected_town: IrlTowns): boolean => town === selected_town.id))}
    );

    public ngOnInit(): void {
        this.start();
    }

    private start(): void {
        const data: Data = {
            nodes: this.nodes_view,
            edges: this.edges
        };
        const options: Options = {
            nodes: {
                shape: 'box',
                size: 20
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
                stabilization: {iterations: 150}
            }
        };

        new Network(this.container?.nativeElement, data, options);
    }
}

interface IrlNode {
    id: string;
    label: string;
    color: IrlNodeColor;
    towns: TownId[];
}

interface IrlNodeColor {
    background: string;
    border: string;
}

interface IrlEdge {
    id: number;
    from: string;
    to: string;
    color: string;
    arrows: string | undefined;
    dashes: boolean | undefined;
}
