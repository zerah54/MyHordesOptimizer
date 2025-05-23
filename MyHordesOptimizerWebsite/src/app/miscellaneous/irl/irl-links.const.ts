export const links: IrlLink[] = [
    {from: 'Emy', to: 'Bigonoud', type: 'couple'},
    {from: 'Renack', to: 'Zerah', type: 'couple'},
    {from: 'Emy', to: 'Zerah'},
    {from: 'Emy', to: 'Renack'},
    {from: 'Bigonoud', to: 'Zerah'},
    {from: 'Bigonoud', to: 'Renack'},
    {from: 'Emy', to: 'Netto'},
    {from: 'Emy', to: 'Dolcounette'},
    {from: 'Dolcounette', to: 'Psykokwak'},
    {from: 'Daïlan', to: 'Malphas', type: 'famille'},
    {from: 'Zerah', to: 'Malphas'},
    {from: 'Zerah', to: 'Daïlan'},
    {from: 'Renack', to: 'Malphas'},
    {from: 'Renack', to: 'Daïlan'},
    {from: 'Themis', to: 'Emy'},
    {from: 'Themis', to: 'Bigonoud'},
    {from: 'Kraky', to: 'Emy'},
    {from: 'Kraky', to: 'Davf'},
    {from: 'Kraky', to: 'Helline'},
    {from: 'Kraky', to: 'Yonali'},
    {from: 'Kraky', to: 'Daïlan'},
    {from: 'Kraky', to: 'Solivane'},
    {from: 'Kraky', to: 'Biosha'},
    {from: 'Kraky', to: 'Zocaxu'},
    {from: 'Kraky', to: 'Dodostyle'},
    {from: 'Kraky', to: 'Bigonoud'},
    {from: 'Kraky', to: 'Zerah'},
    {from: 'Kraky', to: 'Renack'},
    {from: 'Kraky', to: 'Katoptris'},
    {from: 'Davf', to: 'Helline', type: 'couple'},
    {from: 'nonorex', to: 'Zerah'},
    {from: 'nonorex', to: 'Renack'},
    {from: 'nonorex', to: 'Malphas'},
    {from: 'nonorex', to: 'Daïlan'},
    {from: 'Yonali', to: 'Solivane'},
    {from: 'Yonali', to: 'Arendil'},
    {from: 'Yonali', to: 'Paulo'},
    {from: 'Yonali', to: 'Than'},
    {from: 'Yonali', to: 'Dolcounette'},
    {from: 'Yonali', to: 'Biosha'},
    {from: 'Yonali', to: 'Dodostyle'},
    {from: 'Yonali', to: 'Zocaxu'},
    {from: 'Yonali', to: 'Davf'},
    {from: 'Katoptris', to: 'Zerah'},
    {from: 'Katoptris', to: 'Renack'},
    {from: 'Katoptris', to: 'nonorex'},
    {from: 'Katoptris', to: 'Emy'},
    {from: 'Katoptris', to: 'Malphas', type: 'couple'},
    {from: 'Katoptris', to: 'Daïlan'},
    {from: 'Katoptris', to: 'Étoile de Feu'},
    {from: 'Katoptris', to: 'Paulo'},
    {from: 'Eragony', to: 'Emy'},
    {from: 'Eragony', to: 'Bigonoud'},
    {from: 'Eragony', to: 'Dolcounette'},
    {from: 'Eragony', to: 'Kraky'},
    {from: 'Cessouu', to: 'Kraky'},
    {from: 'Cessouu', to: 'Davf'},
];

export interface IrlLink {
    from: string;
    to: string;
    type?: 'couple' | 'famille';
}
