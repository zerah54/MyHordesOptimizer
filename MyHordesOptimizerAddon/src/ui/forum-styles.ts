import { mho_forum_thread_styles_key } from '../config/constants';
import { empty_forum_thread_style, forum_thread_tags, getDefaultForumThreadStyleRules } from '../data/forum-styles';
import { state } from '../state';
import type { ForumThreadStyle, ForumThreadStyleRule, ForumThreadTag } from '../types';
import { cancelWaitForElement, waitForElement } from '../utils/dom-wait';
import { getI18N } from '../utils/i18n';
import { pageIsForum } from '../utils/page';
import { getStorageItem, setStorageItem } from '../utils/storage';

/** Classe posée sur le span créé autour du texte du titre, pour pouvoir le styler sans toucher aux tags et icônes */
const title_class: string = 'mho-thread-title';
/** Classe posée sur le span de préfixe, recréé à chaque passe */
const prefix_class: string = 'mho-thread-prefix';
/** Les propriétés que l'on pose sur la ligne du sujet, et donc les seules à retirer lors d'une remise à zéro */
const row_properties: string[] = ['background-color', 'background-image', 'opacity'];
/** Épaisseur de la barre de couleur posée à gauche de la ligne */
const border_width: string = '4px';
/** Clé d'attente : une seule attente de la liste en vol, quel que soit le nombre de rejeux */
const wait_key_forum_threads: string = 'forum-styles:thread-list';

/**
 * Les règles en mémoire, pour que l'application des styles reste synchrone
 * une fois le premier chargement effectué.
 */
let rules_cache: ForumThreadStyleRule[] | undefined = undefined;

//////////////////////////////
// Chargement / persistance //
//////////////////////////////

/** Charge les règles depuis le stockage, en retombant sur les règles par défaut à la première utilisation */
export function loadForumThreadStyleRules(): Promise<ForumThreadStyleRule[]> {
    if (rules_cache) return Promise.resolve(rules_cache);

    return getStorageItem(mho_forum_thread_styles_key).then((stored: unknown) => {
        rules_cache = Array.isArray(stored) ? stored.map(sanitizeRule) : getDefaultForumThreadStyleRules();
        return rules_cache;
    });
}

/** Les règles déjà chargées, ou un tableau vide si le chargement n'a pas encore eu lieu */
export function getForumThreadStyleRules(): ForumThreadStyleRule[] {
    return rules_cache ?? [];
}

/** Persiste les règles et met le cache à jour */
export function saveForumThreadStyleRules(rules: ForumThreadStyleRule[]): Promise<void> {
    rules_cache = rules.map(sanitizeRule);
    return Promise.resolve(setStorageItem(mho_forum_thread_styles_key, rules_cache)).then(() => undefined);
}

/** Sérialise des règles en une ligne, format d'échange entre joueurs */
export function serializeForumThreadStyleRules(rules: ForumThreadStyleRule[]): string {
    return JSON.stringify(rules.map(sanitizeRule));
}

/**
 * Relit des règles reçues d'un autre joueur. Le contenu est saisi à la main :
 * tout est vérifié, et `null` signale une saisie inexploitable.
 * @param {string} value    Le texte collé par l'utilisateur
 */
export function parseForumThreadStyleRules(value: string): ForumThreadStyleRule[] | null {
    let parsed: unknown;

    try {
        parsed = JSON.parse((value ?? '').trim());
    } catch {
        return null;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (parsed.some((rule: unknown) => typeof rule !== 'object' || rule === null || Array.isArray(rule))) return null;

    return parsed.map(sanitizeRule);
}

/**
 * Complète une règle éventuellement partielle (stockage écrit par une version
 * antérieure de l'addon, ou altéré) pour garantir la forme attendue.
 */
function sanitizeRule(rule: Partial<ForumThreadStyleRule>): ForumThreadStyleRule {
    const style: Partial<ForumThreadStyle> = rule?.style ?? {};
    return {
        id: rule?.id ?? `rule_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        enabled: rule?.enabled !== false,
        tags: Array.isArray(rule?.tags) ? rule.tags.filter((tag: string) => !!tag) : [],
        words: Array.isArray(rule?.words) ? rule.words.map((word: string) => `${word}`.trim()).filter((word: string) => word !== '') : [],
        style: {
            color: style.color ?? null,
            background: style.background ?? null,
            border: style.border ?? null,
            size: typeof style.size === 'number' ? style.size : 100,
            opacity: typeof style.opacity === 'number' ? style.opacity : 100,
            prefix: style.prefix ?? ''
        }
    };
}

/////////////
// Ciblage //
/////////////

/** Minuscules, sans accents ni espaces superflus : la seule forme sur laquelle on compare des textes */
export function normalizeForumText(value: string): string {
    return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Les tags proposés dans la modale : ceux réellement autorisés dans le forum
 * affiché (lus dans le formulaire de filtre, seul endroit de la page qui
 * associe le nom technique au libellé traduit), complétés par les tags connus.
 */
export function getAvailableForumThreadTags(): ForumThreadTag[] {
    const from_page: ForumThreadTag[] = [];
    const filters: NodeListOf<HTMLLabelElement> = document.querySelectorAll('.forum-filter-list label');

    Array.from(filters).forEach((filter: HTMLLabelElement) => {
        const input: HTMLInputElement | null = filter.querySelector('input[name]');
        const name: string | null = input?.getAttribute('name') ?? null;
        const label: string = (filter.textContent ?? '').trim();
        if (!name || label === '') return;

        const known: ForumThreadTag | undefined = forum_thread_tags.find((tag: ForumThreadTag) => tag.name === name);
        from_page.push({
            name: name,
            color: known?.color ?? null,
            label: { fr: label, en: label, de: label, es: label }
        });
    });

    const missing: ForumThreadTag[] = forum_thread_tags.filter((tag: ForumThreadTag) => !from_page.some((page_tag: ForumThreadTag) => page_tag.name === tag.name));
    return [...from_page, ...missing];
}

/** Associe le libellé traduit affiché sur un sujet au nom technique du tag correspondant */
function buildTagLabelMap(): Map<string, string> {
    const map: Map<string, string> = new Map<string, string>();
    getAvailableForumThreadTags().forEach((tag: ForumThreadTag) => {
        const label: string = normalizeForumText(getI18N(tag.label));
        if (label !== '' && !map.has(label)) {
            map.set(label, tag.name);
        }
    });
    return map;
}

/** Convertit une couleur calculée par le navigateur (`rgb(...)`) en `#rrggbb` */
function rgbToHex(color: string): string | null {
    const match: RegExpMatchArray | null = (color ?? '').match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    return '#' + [match[1], match[2], match[3]].map((part: string) => (+part).toString(16).padStart(2, '0')).join('');
}

/**
 * Le nom technique du tag d'un sujet. Le DOM n'affiche que le libellé traduit :
 * on le retraduit via le formulaire de filtre, et à défaut via la couleur du tag,
 * qui est propre à chaque tag coloré.
 */
function resolveTagName(row: HTMLElement, label_to_name: Map<string, string>): string | null {
    const tag_element: HTMLElement | null = row.querySelector('.thread-tag');
    if (!tag_element) return null;

    const by_label: string | undefined = label_to_name.get(normalizeForumText(tag_element.textContent ?? ''));
    if (by_label) return by_label;

    const color: string | null = rgbToHex(tag_element.style.backgroundColor);
    const by_color: ForumThreadTag | undefined = color ? forum_thread_tags.find((tag: ForumThreadTag) => tag.color === color) : undefined;
    return by_color?.name ?? null;
}

/** Une règle s'applique si tous ses critères renseignés sont satisfaits ; une règle sans critère ne cible rien */
function ruleMatches(rule: ForumThreadStyleRule, tag_name: string | null, title: string): boolean {
    if (!rule.enabled) return false;

    const has_tags: boolean = rule.tags.length > 0;
    const has_words: boolean = rule.words.length > 0;
    if (!has_tags && !has_words) return false;

    if (has_tags && (!tag_name || !rule.tags.includes(tag_name))) return false;

    if (has_words) {
        const normalized_title: string = normalizeForumText(title);
        if (!rule.words.some((word: string) => normalized_title.includes(normalizeForumText(word)))) return false;
    }

    return true;
}

/**
 * Empile les styles des règles correspondantes : l'ordre de la liste est un
 * ordre de priorité, donc pour une propriété donnée c'est la première règle
 * qui la renseigne qui l'emporte.
 */
export function mergeForumThreadStyles(styles: ForumThreadStyle[]): ForumThreadStyle {
    return styles.reduce((merged: ForumThreadStyle, style: ForumThreadStyle) => ({
        color: merged.color ?? style.color,
        background: merged.background ?? style.background,
        border: merged.border ?? style.border,
        size: merged.size !== 100 ? merged.size : style.size,
        opacity: merged.opacity !== 100 ? merged.opacity : style.opacity,
        prefix: merged.prefix !== '' ? merged.prefix : style.prefix
    }), { ...empty_forum_thread_style });
}

//////////////////
// Application  //
//////////////////

/**
 * Isole le texte du titre dans un span dédié : le conteneur d'origine porte
 * aussi le tag et les icônes de modération, qui ne doivent pas être stylés.
 */
function ensureTitleElement(row: HTMLElement): HTMLElement | null {
    const container: HTMLElement | null = row.querySelector('.title > div');
    if (!container) return null;

    const existing: HTMLElement | null = container.querySelector(`.${title_class}`);
    if (existing) return existing;

    const text_nodes: ChildNode[] = Array.from(container.childNodes)
        .filter((node: ChildNode) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '');
    if (text_nodes.length === 0) return null;

    const wrapper: HTMLElement = document.createElement('span');
    wrapper.classList.add(title_class);
    container.insertBefore(wrapper, text_nodes[0]);
    text_nodes.forEach((node: ChildNode) => wrapper.appendChild(node));

    return wrapper;
}

/** Retire tout ce que l'addon a pu poser sur une ligne, sans défaire l'isolation du titre */
function resetRow(row: HTMLElement): void {
    row_properties.forEach((property: string) => row.style.removeProperty(property));
    row.querySelector(`.${prefix_class}`)?.remove();

    const title_element: HTMLElement | null = row.querySelector(`.${title_class}`);
    if (title_element) {
        title_element.removeAttribute('style');
    }
}

/** Applique un style fusionné à une ligne et à son titre ; également utilisé pour l'aperçu de la modale */
export function applyForumThreadStyleToElements(row: HTMLElement, title_element: HTMLElement, style: ForumThreadStyle): void {
    if (style.color) title_element.style.color = style.color;
    if (style.size !== 100) title_element.style.fontSize = `${style.size}%`;

    if (style.background) row.style.backgroundColor = style.background;
    // Barre peinte dans le fond plutôt qu'en bordure : une vraie bordure élargirait
    // la ligne et décalerait la pastille de sujet non lu, positionnée en absolu par le jeu
    if (style.border) {
        row.style.backgroundImage = `linear-gradient(to right, ${style.border} 0, ${style.border} ${border_width}, transparent ${border_width})`;
    }
    if (style.opacity !== 100) row.style.opacity = `${style.opacity / 100}`;

    if (style.prefix !== '') {
        const prefix: HTMLElement = document.createElement('span');
        prefix.classList.add(prefix_class);
        prefix.textContent = `${style.prefix} `;
        if (style.color) prefix.style.color = style.color;
        title_element.parentElement?.insertBefore(prefix, title_element);
    }
}

/**
 * Style les titres des sujets de la liste du forum selon les règles enregistrées.
 * Rejouée à chaque navigation : la fonction est idempotente et remet d'abord
 * chaque ligne dans son état d'origine.
 *
 * La liste est injectée en AJAX et peut n'arriver qu'après l'évènement de navigation.
 * On attend donc son apparition, au lieu des deux tentatives espacées d'origine qui
 * abandonnaient au bout d'une seconde et laissaient la liste non stylée.
 *
 * Volontairement PAS de surveillance des re-rendus ici : l'application des styles
 * retire puis réinsère le préfixe de chaque ligne, ce qu'un observateur poserait
 * sur la liste interpréterait comme un changement, en boucle sans fin.
 */
export function styleForumThreadTitles(): void {
    const is_enabled: boolean = !!state.mho_parameters?.custom_forum_thread_styles && pageIsForum();

    if (!is_enabled) {
        cancelWaitForElement(wait_key_forum_threads);
        Array.from(document.querySelectorAll('.forum-thread')).forEach(resetRow);
        return;
    }

    waitForElement(wait_key_forum_threads, '.forum-thread', () => {
        /** La liste peut apparaître après un changement de page ou d'option */
        if (!state.mho_parameters?.custom_forum_thread_styles || !pageIsForum()) return;

        loadForumThreadStyleRules().then((rules: ForumThreadStyleRule[]) => applyForumThreadStyles(rules));
    });
}

/** Applique immédiatement un jeu de règles à la liste affichée (utilisé aussi à l'enregistrement de la modale) */
export function applyForumThreadStyles(rules: ForumThreadStyleRule[]): void {
    const rows: HTMLElement[] = Array.from(document.querySelectorAll('.forum-thread'));
    if (rows.length === 0) return;

    const label_to_name: Map<string, string> = buildTagLabelMap();

    rows.forEach((row: HTMLElement) => {
        resetRow(row);

        const title_element: HTMLElement | null = ensureTitleElement(row);
        if (!title_element) return;

        const tag_name: string | null = resolveTagName(row, label_to_name);
        const title: string = title_element.textContent ?? '';
        const matching: ForumThreadStyle[] = rules
            .filter((rule: ForumThreadStyleRule) => ruleMatches(rule, tag_name, title))
            .map((rule: ForumThreadStyleRule) => rule.style);

        if (matching.length === 0) return;
        applyForumThreadStyleToElements(row, title_element, mergeForumThreadStyles(matching));
    });
}
