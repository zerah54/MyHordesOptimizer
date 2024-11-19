import { TownId } from './irl-towns.const';

export const people: IrlPeople[] = [
    {id: 'Emy', towns: ['DMHv3', 'FHv2', 'BB']},
    {id: 'Bigonoud', towns: ['DMHv3', 'FHv2', 'BB']},
    {id: 'Renack', towns: ['DMHv3', 'FHv2']},
    {id: 'Zerah', towns: ['DMHv3', 'FHv2', 'BB']},
    {id: 'Malphas', towns: ['DMHv3']},
    {id: 'Daïlan', towns: ['DMHv3', 'FHv2']},
    {id: 'Dolcounette', towns: ['DMHv3', 'FHv2', 'BB']},
    {id: 'Psykokwak', towns: ['DMHv3', 'FHv2']},
    {id: 'Netto', towns: ['DMHv3', 'FHv2']},
    {id: 'Themis', towns: ['DMHv3']},
    {id: 'Kraky', towns: ['FHv2']},
    {id: 'Davf', towns: ['FHv2', 'BB']},
    {id: 'Helline', towns: ['DMHv3', 'FHv2', 'BB']},
    {id: 'Eragony', towns: ['DMHv3', 'FHv2']},
    {id: 'nonorex', towns: ['FHv2']},
    {id: 'Yonali', towns: ['FHv2']},
    {id: 'Solivane', towns: ['FHv2']},
    {id: 'Arendil', towns: ['FHv2']},
    {id: 'Paulo', towns: ['FHv2']},
    {id: 'Than', towns: ['FHv2']},
    {id: 'Biosha', towns: ['FHv2']},
    {id: 'Dodostyle', towns: ['DMHv3', 'FHv2', 'BB']},
    {id: 'Zocaxu', towns: ['FHv2']},
    {id: 'Katoptris', towns: ['BB']},
    {id: 'Cessouu', towns: ['FHv2']},
    {id: 'Étoile de Feu', towns: ['FHv2', 'BB']},
];

export interface IrlPeople {
    id: string;
    towns: TownId[];
}

