import { mho_forum_styles_modal_id } from '../config/constants';
import { createEmptyForumThreadStyleRule, getDefaultForumThreadStyleRules } from '../data/forum-styles';
import { texts } from '../i18n/texts';
import type { ForumThreadStyle, ForumThreadStyleRule, ForumThreadTag, I18nLabel } from '../types';
import { createCheckboxDropdown } from '../utils/dom';
import { getI18N } from '../utils/i18n';
import { copyToClipboard } from '../utils/misc';
import { addSuccess } from '../utils/notifications';
import {
    applyForumThreadStyles,
    applyForumThreadStyleToElements,
    getAvailableForumThreadTags,
    loadForumThreadStyleRules,
    parseForumThreadStyleRules,
    saveForumThreadStyleRules,
    serializeForumThreadStyleRules
} from './forum-styles';

/** La couleur des tags que MyHordes laisse sans couleur propre (`00000030` côté fixtures) */
const default_tag_color: string = 'rgba(0, 0, 0, 0.19)';

/** Les couleurs proposées par défaut dans les sélecteurs, quand la propriété vient d'être activée */
const default_colors: Record<string, string> = {
    color: '#f0d79e',
    background: '#5c2b20',
    border: '#ddab76'
};

/** Ouvre la modale de configuration des styles de titres de sujets */
export function openForumThreadStylesModal(): void {
    document.getElementById(mho_forum_styles_modal_id)?.remove();

    loadForumThreadStyleRules().then((rules: ForumThreadStyleRule[]) => {
        // Copie de travail : rien n'est persisté tant que l'utilisateur n'a pas enregistré
        const working_rules: ForumThreadStyleRule[] = rules.map(cloneRule);
        const available_tags: ForumThreadTag[] = getAvailableForumThreadTags();

        const overlay: HTMLElement = document.createElement('div');
        overlay.id = mho_forum_styles_modal_id;
        overlay.classList.add('mho-modal-overlay');

        const box: HTMLElement = document.createElement('div');
        box.classList.add('mho-modal-box', 'mho-forum-styles-box');
        overlay.appendChild(box);

        const title: HTMLElement = document.createElement('h3');
        title.classList.add('mho-modal-title');
        title.innerText = getI18N(texts.forum_styles_title);
        box.appendChild(title);

        const rules_container: HTMLElement = document.createElement('div');
        rules_container.classList.add('mho-forum-styles-rules');
        box.appendChild(rules_container);

        const renderRules = (): void => {
            rules_container.innerHTML = '';

            if (working_rules.length === 0) {
                const empty: HTMLElement = document.createElement('p');
                empty.classList.add('mho-forum-styles-help');
                empty.innerText = getI18N(texts.forum_styles_empty);
                rules_container.appendChild(empty);
                return;
            }

            working_rules.forEach((rule: ForumThreadStyleRule, index: number) => {
                rules_container.appendChild(createRuleBlock(rule, index, working_rules, available_tags, renderRules));
            });
        };

        renderRules();

        // « Ajouter une règle » prolonge la liste : il reste au-dessus du séparateur
        const add_container: HTMLElement = document.createElement('div');
        add_container.classList.add('mho-forum-styles-add');
        box.appendChild(add_container);

        const add_button: HTMLButtonElement = createModalButton(texts.forum_styles_add_rule);
        add_button.addEventListener('click', () => {
            working_rules.push(createEmptyForumThreadStyleRule(`rule_${Date.now()}`));
            renderRules();
        });
        add_container.appendChild(add_button);

        // Zone d'échange : l'export copie la configuration affichée, l'import la remplace
        const exchange: HTMLElement = document.createElement('div');
        exchange.classList.add('mho-forum-styles-exchange');
        exchange.style.display = 'none';
        box.appendChild(exchange);

        const exchange_input: HTMLTextAreaElement = document.createElement('textarea');
        exchange_input.classList.add('mho-input', 'mho-forum-styles-exchange-input');
        exchange_input.rows = 3;
        exchange_input.placeholder = getI18N(texts.forum_styles_import_placeholder);
        exchange.appendChild(exchange_input);

        const exchange_error: HTMLElement = document.createElement('div');
        exchange_error.classList.add('mho-forum-styles-warning');
        exchange_error.innerText = getI18N(texts.forum_styles_import_error);
        exchange.appendChild(exchange_error);

        const exchange_actions: HTMLElement = document.createElement('div');
        exchange_actions.classList.add('mho-forum-styles-exchange-actions');
        exchange.appendChild(exchange_actions);

        const exchange_confirm: HTMLButtonElement = createModalButton(texts.forum_styles_import_confirm);
        exchange_confirm.addEventListener('click', () => {
            const imported: ForumThreadStyleRule[] | null = parseForumThreadStyleRules(exchange_input.value);

            if (!imported) {
                exchange_error.style.display = 'block';
                return;
            }

            working_rules.splice(0, working_rules.length, ...imported);
            renderRules();
            exchange.style.display = 'none';
            exchange_input.value = '';
        });
        exchange_actions.appendChild(exchange_confirm);

        const exchange_cancel: HTMLButtonElement = createModalButton(texts.forum_styles_cancel);
        exchange_cancel.addEventListener('click', () => {
            exchange.style.display = 'none';
            exchange_input.value = '';
        });
        exchange_actions.appendChild(exchange_cancel);

        const footer: HTMLElement = document.createElement('div');
        footer.classList.add('mho-modal-footer', 'mho-forum-styles-footer');
        box.appendChild(footer);

        const reset_button: HTMLButtonElement = createModalButton(texts.forum_styles_reset);
        reset_button.addEventListener('click', () => {
            working_rules.splice(0, working_rules.length, ...getDefaultForumThreadStyleRules());
            renderRules();
        });
        footer.appendChild(reset_button);

        const export_button: HTMLButtonElement = createModalButton(texts.forum_styles_export);
        export_button.addEventListener('click', () => {
            copyToClipboard(serializeForumThreadStyleRules(working_rules));
            addSuccess(getI18N(texts.forum_styles_export_done));
        });
        footer.appendChild(export_button);

        const import_button: HTMLButtonElement = createModalButton(texts.forum_styles_import);
        import_button.addEventListener('click', () => {
            exchange.style.display = 'flex';
            exchange_error.style.display = 'none';
            exchange_input.focus();
        });
        footer.appendChild(import_button);

        const spacer: HTMLElement = document.createElement('span');
        spacer.classList.add('mho-forum-styles-footer-spacer');
        footer.appendChild(spacer);

        const cancel_button: HTMLButtonElement = createModalButton(texts.forum_styles_cancel);
        cancel_button.addEventListener('click', () => overlay.remove());
        footer.appendChild(cancel_button);

        const save_button: HTMLButtonElement = createModalButton(texts.forum_styles_save);
        save_button.addEventListener('click', () => {
            saveForumThreadStyleRules(working_rules).then(() => {
                applyForumThreadStyles(working_rules);
                overlay.remove();
            });
        });
        footer.appendChild(save_button);

        overlay.addEventListener('click', (event: MouseEvent) => {
            if (event.target === overlay) overlay.remove();
        });

        const post_office: HTMLElement | null = document.getElementById('post-office');
        if (post_office) {
            post_office.parentNode?.insertBefore(overlay, post_office.nextSibling);
        } else {
            document.body.appendChild(overlay);
        }
    });
}

/** Copie profonde d'une règle, pour ne pas modifier le cache tant que rien n'est enregistré */
function cloneRule(rule: ForumThreadStyleRule): ForumThreadStyleRule {
    return { ...rule, tags: [...rule.tags], words: [...rule.words], style: { ...rule.style } };
}

/**
 * Construit le bloc d'édition d'une règle.
 * @param {ForumThreadStyleRule} rule            La règle éditée (modifiée en place)
 * @param {number} index                         Sa position dans la liste
 * @param {ForumThreadStyleRule[]} rules         La liste complète, pour le déplacement et la suppression
 * @param {ForumThreadTag[]} available_tags      Les tags proposés
 * @param {Function} onStructureChange           À appeler quand la liste elle-même change
 */
function createRuleBlock(
    rule: ForumThreadStyleRule,
    index: number,
    rules: ForumThreadStyleRule[],
    available_tags: ForumThreadTag[],
    onStructureChange: () => void
): HTMLElement {
    const block: HTMLElement = document.createElement('div');
    block.classList.add('mho-forum-styles-rule');

    // ── En-tête : activation, aperçu, déplacement, suppression ──────────────
    const header: HTMLElement = document.createElement('div');
    header.classList.add('mho-forum-styles-rule-header');
    block.appendChild(header);

    const enabled_input: HTMLInputElement = document.createElement('input');
    enabled_input.type = 'checkbox';
    enabled_input.checked = rule.enabled;
    enabled_input.classList.add('mho-input');
    header.appendChild(enabled_input);

    const preview: HTMLElement = document.createElement('span');
    preview.classList.add('mho-forum-styles-preview');
    header.appendChild(preview);

    const updatePreview = (): void => renderPreview(preview, rule.style);
    updatePreview();

    enabled_input.addEventListener('change', () => {
        rule.enabled = enabled_input.checked;
        block.classList.toggle('mho-forum-styles-rule-disabled', !rule.enabled);
    });
    block.classList.toggle('mho-forum-styles-rule-disabled', !rule.enabled);

    const actions: HTMLElement = document.createElement('span');
    actions.classList.add('mho-forum-styles-rule-actions');
    header.appendChild(actions);

    const up_button: HTMLButtonElement = createIconButton('▲', texts.forum_styles_move_up);
    up_button.disabled = index === 0;
    up_button.addEventListener('click', () => {
        rules.splice(index - 1, 0, ...rules.splice(index, 1));
        onStructureChange();
    });
    actions.appendChild(up_button);

    const down_button: HTMLButtonElement = createIconButton('▼', texts.forum_styles_move_down);
    down_button.disabled = index === rules.length - 1;
    down_button.addEventListener('click', () => {
        rules.splice(index + 1, 0, ...rules.splice(index, 1));
        onStructureChange();
    });
    actions.appendChild(down_button);

    const delete_button: HTMLButtonElement = createIconButton('✕', texts.forum_styles_delete);
    delete_button.addEventListener('click', () => {
        rules.splice(index, 1);
        onStructureChange();
    });
    actions.appendChild(delete_button);

    // ── Critères : tags et mots ─────────────────────────────────────────────
    const criteria: HTMLElement = document.createElement('div');
    criteria.classList.add('mho-forum-styles-criteria');
    block.appendChild(criteria);

    // Le volet et les tags retenus forment un bloc, les mots en forment un autre
    const tags_group: HTMLElement = document.createElement('div');
    tags_group.classList.add('mho-forum-styles-criteria-group');
    criteria.appendChild(tags_group);

    // Le même volet déroulant à cases à cocher que les filtres des listes de citoyens,
    // mais dont les options sont rendues comme les tags le sont dans le forum
    const tags_dropdown: { container: HTMLDivElement; getSelectedValues: () => string[] } = createCheckboxDropdown(
        getI18N(texts.forum_styles_tags),
        `mho-forum-styles-tags-${rule.id}`,
        available_tags.map((tag: ForumThreadTag) => ({
            value: tag.name,
            text: getI18N(tag.label),
            decorate: (): HTMLElement => createTagChip(tag)
        })),
        () => {
            rule.tags = tags_dropdown.getSelectedValues();
            renderSelectedTags();
            updateCriteriaWarning();
        },
        rule.tags
    );
    tags_group.appendChild(tags_dropdown.container);

    // Le volet s'ouvre dans une zone défilante : on le ramène dans la vue s'il déborde
    tags_dropdown.container.addEventListener('click', () => {
        setTimeout(() => {
            const panel: HTMLElement | null = tags_dropdown.container.querySelector('.mho-checkbox-dropdown-panel');
            if (panel && panel.style.display === 'block') panel.scrollIntoView({ block: 'nearest' });
        });
    });

    // Rappel des tags retenus, retirables sans rouvrir le volet
    const selected_tags: HTMLElement = document.createElement('div');
    selected_tags.classList.add('mho-forum-styles-selected-tags');
    tags_group.appendChild(selected_tags);

    function renderSelectedTags(): void {
        selected_tags.innerHTML = '';

        rule.tags.forEach((name: string) => {
            const tag: ForumThreadTag | undefined = available_tags.find((available: ForumThreadTag) => available.name === name);
            if (!tag) return;

            selected_tags.appendChild(createTagChip(tag, () => {
                // On décoche la case du volet : c'est elle qui fait foi, et son
                // évènement remet à jour la règle, le libellé du volet et cette liste
                const checkbox: HTMLInputElement | null = tags_dropdown.container.querySelector(`input[type="checkbox"][value="${name}"]`);
                if (!checkbox) return;
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change'));
            }));
        });
    }

    renderSelectedTags();

    const words_field: HTMLElement = document.createElement('div');
    words_field.classList.add('mho-filter-field', 'mho-forum-styles-words-field');
    criteria.appendChild(words_field);

    const words_label: HTMLLabelElement = document.createElement('label');
    words_label.classList.add('mho-filter-label');
    words_label.innerText = getI18N(texts.forum_styles_words);
    words_field.appendChild(words_label);

    const words_input: HTMLInputElement = document.createElement('input');
    words_input.type = 'text';
    words_input.classList.add('mho-input', 'mho-forum-styles-words');
    words_input.placeholder = getI18N(texts.forum_styles_words_placeholder);
    words_input.value = rule.words.join(', ');
    words_input.addEventListener('input', () => {
        rule.words = words_input.value.split(',').map((word: string) => word.trim()).filter((word: string) => word !== '');
        updateCriteriaWarning();
    });
    words_field.appendChild(words_input);

    const warning: HTMLElement = document.createElement('div');
    warning.classList.add('mho-forum-styles-warning');
    warning.innerText = getI18N(texts.forum_styles_no_criteria);
    block.appendChild(warning);

    function updateCriteriaWarning(): void {
        warning.style.display = rule.tags.length === 0 && rule.words.length === 0 ? 'block' : 'none';
    }

    updateCriteriaWarning();

    // ── Style ───────────────────────────────────────────────────────────────
    const style_container: HTMLElement = document.createElement('div');
    style_container.classList.add('mho-forum-styles-style');
    block.appendChild(style_container);

    style_container.appendChild(createColorField(texts.forum_styles_text_color, rule.style, 'color', updatePreview));
    style_container.appendChild(createColorField(texts.forum_styles_background, rule.style, 'background', updatePreview));
    style_container.appendChild(createColorField(texts.forum_styles_border, rule.style, 'border', updatePreview));

    style_container.appendChild(createNumberField(texts.forum_styles_size, rule.style, 'size', 50, 200, 5, updatePreview));
    style_container.appendChild(createNumberField(texts.forum_styles_opacity, rule.style, 'opacity', 10, 100, 5, updatePreview));

    const prefix_field: HTMLElement = document.createElement('label');
    prefix_field.classList.add('mho-forum-styles-field');
    prefix_field.appendChild(document.createTextNode(getI18N(texts.forum_styles_prefix)));

    const prefix_input: HTMLInputElement = document.createElement('input');
    prefix_input.type = 'text';
    prefix_input.maxLength = 4;
    prefix_input.classList.add('mho-forum-styles-prefix');
    prefix_input.value = rule.style.prefix;
    prefix_input.addEventListener('input', () => {
        rule.style.prefix = prefix_input.value.trim();
        updatePreview();
    });
    prefix_field.appendChild(prefix_input);
    style_container.appendChild(prefix_field);

    return block;
}

/**
 * Reproduit le rendu d'un tag tel que le forum l'affiche : pastille colorée dont
 * la couleur de texte suit la même règle de luminance que le site.
 * @param {ForumThreadTag} tag      Le tag à représenter
 * @param {Function} onRemove       Ajoute une croix de retrait quand elle est fournie
 */
function createTagChip(tag: ForumThreadTag, onRemove?: () => void): HTMLElement {
    const chip: HTMLElement = document.createElement('span');
    chip.classList.add('thread-tag', 'mho-forum-styles-tag-chip');
    chip.style.backgroundColor = tag.color ?? default_tag_color;
    chip.style.color = getTagTextColor(tag.color);
    chip.appendChild(document.createTextNode(getI18N(tag.label)));

    if (onRemove) {
        const remove: HTMLElement = document.createElement('span');
        remove.classList.add('mho-forum-styles-tag-remove');
        remove.innerText = '✕';
        remove.title = getI18N(texts.forum_styles_delete);
        remove.addEventListener('click', (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
        });
        chip.appendChild(remove);
    }

    return chip;
}

/**
 * Noir ou blanc selon la luminance du fond, avec les coefficients et le seuil
 * utilisés par MyHordes pour ses propres tags.
 * @param {string} color    La couleur de fond du tag, ou `null` pour la couleur par défaut
 */
function getTagTextColor(color: string | null): string {
    if (!color) return '#ffffff';

    const hex: string = color.replace('#', '');
    if (hex.length < 6) return '#ffffff';

    const luminance: number = parseInt(hex.substring(0, 2), 16) * 0.299
        + parseInt(hex.substring(2, 4), 16) * 0.587
        + parseInt(hex.substring(4, 6), 16) * 0.114;

    return luminance > 150 ? '#000000' : '#ffffff';
}

/** Rend l'aperçu d'un style, en réutilisant exactement le rendu appliqué au forum */
function renderPreview(container: HTMLElement, style: ForumThreadStyle): void {
    container.innerHTML = '';
    container.removeAttribute('style');

    const title: HTMLElement = document.createElement('span');
    title.innerText = getI18N(texts.forum_styles_preview_text);
    container.appendChild(title);

    applyForumThreadStyleToElements(container, title, style);
}

/** Champ « couleur » : une case pour activer la propriété, un sélecteur pour la valeur */
function createColorField(label: I18nLabel, style: ForumThreadStyle, property: 'color' | 'background' | 'border', onChange: () => void): HTMLElement {
    const field: HTMLElement = document.createElement('label');
    field.classList.add('mho-forum-styles-field');

    const enabled_input: HTMLInputElement = document.createElement('input');
    enabled_input.type = 'checkbox';
    enabled_input.classList.add('mho-input');
    enabled_input.checked = style[property] !== null;
    field.appendChild(enabled_input);

    field.appendChild(document.createTextNode(getI18N(label)));

    const color_input: HTMLInputElement = document.createElement('input');
    color_input.type = 'color';
    color_input.classList.add('mho-forum-styles-color');
    color_input.value = style[property] ?? default_colors[property];
    color_input.disabled = style[property] === null;
    field.appendChild(color_input);

    enabled_input.addEventListener('change', () => {
        style[property] = enabled_input.checked ? color_input.value : null;
        color_input.disabled = !enabled_input.checked;
        onChange();
    });

    color_input.addEventListener('input', () => {
        style[property] = color_input.value;
        onChange();
    });

    return field;
}

/** Champ numérique exprimé en pourcentage : taille et opacité */
function createNumberField(
    label: I18nLabel,
    style: ForumThreadStyle,
    property: 'size' | 'opacity',
    min: number,
    max: number,
    step: number,
    onChange: () => void
): HTMLElement {
    const field: HTMLElement = document.createElement('label');
    field.classList.add('mho-forum-styles-field');
    field.appendChild(document.createTextNode(getI18N(label)));

    const input: HTMLInputElement = document.createElement('input');
    input.type = 'number';
    input.min = `${min}`;
    input.max = `${max}`;
    input.step = `${step}`;
    input.value = `${style[property]}`;
    input.classList.add('mho-forum-styles-number');
    input.addEventListener('input', () => {
        const value: number = Math.min(max, Math.max(min, +input.value || 100));
        style[property] = value;
        onChange();
    });

    field.appendChild(input);
    field.appendChild(document.createTextNode('%'));
    return field;
}

/** Bouton d'action de la modale, au gabarit commun aux modales de l'addon */
function createModalButton(label: I18nLabel): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement('button');
    button.type = 'button';
    button.classList.add('mho-modal-btn', 'inline');
    button.innerText = getI18N(label);
    return button;
}

/** Petit bouton d'action sur une règle */
function createIconButton(icon: string, label: I18nLabel): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement('button');
    button.type = 'button';
    button.classList.add('mho-forum-styles-icon-btn', 'inline');
    button.innerText = icon;
    button.title = getI18N(label);
    return button;
}
