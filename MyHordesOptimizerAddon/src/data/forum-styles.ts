import type { ForumThreadStyle, ForumThreadStyleRule, ForumThreadTag } from '../types';

/////////////////////////////////////////////////////////////////////////
// Les tags de sujets connus côté MyHordes.                            //
// Seul le `name` est stable d'une langue à l'autre : le libellé rendu //
// dans la page est traduit. Les libellés ci-dessous ne servent que de  //
// secours quand la page ne permet pas de reconstruire la liste.        //
// L'ordre reprend celui des fixtures du jeu (ForumThreadTagDataService),//
// qui est aussi l'ordre d'affichage des tags dans l'interface.          //
/////////////////////////////////////////////////////////////////////////
export const forum_thread_tags: ForumThreadTag[] = [
    {
        name: 'bugs',
        color: '#3b1c32',
        label: { fr: 'Bug', en: 'Bug', de: 'Fehler', es: 'Error' }
    },
    {
        name: 'help',
        color: '#ca054d',
        label: { fr: 'Aide', en: 'Help', de: 'Hilfe', es: 'Ayuda' }
    },
    {
        name: 'update',
        color: '#3d405b',
        label: { fr: 'Changelog', en: 'Changelog', de: 'Changelog', es: 'Changelog' }
    },
    {
        name: 'event',
        color: '#43aa8b',
        label: { fr: 'Event', en: 'Event', de: 'Event', es: 'Evento' }
    },
    {
        name: 'rp',
        color: '#d4a373',
        label: { fr: 'RP', en: 'RP', de: 'RP', es: 'RP' }
    },
    {
        name: 'official',
        color: '#aa0000',
        label: { fr: 'Officiel', en: 'Official', de: 'Offiziell', es: 'Oficial' }
    },
    {
        name: 'dsc_update',
        color: null,
        label: { fr: 'Mise à jour', en: 'Update', de: 'Update', es: 'Actualización' }
    },
    {
        name: 'dsc_post',
        color: null,
        label: { fr: 'Post', en: 'Post', de: 'Post', es: 'Post' }
    },
    {
        name: 'dsc_disc',
        color: null,
        label: { fr: 'Disc.', en: 'Disc.', de: 'Disk.', es: 'Disc.' }
    },
    {
        name: 'dsc_guide',
        color: null,
        label: { fr: 'Guide', en: 'Guide', de: 'Guide', es: 'Guía' }
    },
    {
        name: 'dsc_orga',
        color: '#ff8c00',
        label: { fr: 'Orga.', en: 'Orga.', de: 'Orga.', es: 'Orga.' }
    },
    {
        name: 'dsc_sugg',
        color: null,
        label: { fr: 'Suggestion', en: 'Suggestion', de: 'Vorschlag', es: 'Sugerencia' }
    },
    {
        name: 'dsc_salc',
        color: null,
        label: { fr: 'SALC', en: 'SALC', de: 'SALC', es: 'SALC' }
    },
    {
        name: 'dsc_proj',
        color: null,
        label: { fr: 'Projet', en: 'Project', de: 'Projekt', es: 'Proyecto' }
    },
    {
        name: 'dsc_game',
        color: null,
        label: { fr: 'Jeu', en: 'Game', de: 'Spiel', es: 'Juego' }
    },
    {
        name: 'dsc_flood',
        color: null,
        label: { fr: 'Flood', en: 'Spam', de: 'Spam', es: 'Spam' }
    }
];

/** Le style « neutre » : tout est laissé tel quel */
export const empty_forum_thread_style: ForumThreadStyle = {
    color: null,
    background: null,
    border: null,
    size: 100,
    opacity: 100,
    prefix: ''
};

/**
 * Crée une règle vierge.
 * @param {string} id   L'identifiant unique de la règle
 */
export function createEmptyForumThreadStyleRule(id: string): ForumThreadStyleRule {
    return {
        id: id,
        enabled: true,
        tags: [],
        words: [],
        style: { ...empty_forum_thread_style }
    };
}

/**
 * Les règles livrées par défaut : elles ne portent que sur les tags, donc
 * elles fonctionnent quelle que soit la langue du joueur.
 */
export function getDefaultForumThreadStyleRules(): ForumThreadStyleRule[] {
    return [
        {
            id: 'default_official',
            enabled: true,
            tags: ['official'],
            words: [],
            style: { ...empty_forum_thread_style, background: '#63181b', border: '#aa0000' }
        },
        {
            id: 'default_update',
            enabled: true,
            tags: ['update', 'dsc_update'],
            words: [],
            style: { ...empty_forum_thread_style, color: '#9db4ff', border: '#3d405b', prefix: '📢' }
        },
        {
            id: 'default_help',
            enabled: true,
            tags: ['help'],
            words: [],
            style: { ...empty_forum_thread_style, color: '#ff8fb3', prefix: '❓' }
        },
        {
            id: 'default_event',
            enabled: true,
            tags: ['event'],
            words: [],
            style: { ...empty_forum_thread_style, color: '#7fd8bd', prefix: '🎉' }
        },
        {
            id: 'default_orga',
            enabled: true,
            tags: ['dsc_orga'],
            words: [],
            style: { ...empty_forum_thread_style, color: '#ffa94d', background: '#5f371d' }
        },
        {
            id: 'default_guide',
            enabled: true,
            tags: ['dsc_guide'],
            words: [],
            style: { ...empty_forum_thread_style, color: '#c9a9ff', prefix: '📖' }
        },
        {
            id: 'default_rp',
            enabled: true,
            tags: ['rp'],
            words: [],
            style: { ...empty_forum_thread_style, color: '#d4a373' }
        },
        {
            id: 'default_flood',
            enabled: true,
            tags: ['dsc_flood'],
            words: [],
            style: { ...empty_forum_thread_style, opacity: 55, size: 90 }
        }
    ];
}
