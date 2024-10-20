export const towns: IrlTowns[] = [
    { id: 'DMHv3', label: 'DiscMyHordes v3' },
    { id: 'FHv2', label: 'Futuram\'Hordes v2' },
    { id: 'BB', label: 'Bad Baguettes' }
];

export interface IrlTowns {
    id: TownId;
    label: string;
}

export type TownId = 'FHv2' | 'DMHv3' | 'BB';
