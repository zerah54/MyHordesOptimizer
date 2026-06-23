import {texts} from '../i18n/texts';
import {getI18N} from './i18n';

export function createSelectWithSearch() {

    let select_complete = document.createElement('div');

    let select = document.createElement('label');

    let input = document.createElement('input');
    input.classList.add('mho-input');
    input.type = 'text';
    input.autocomplete = 'off';

    let close = document.createElement('div');
    close.innerHTML = '&#128473';
    close.setAttribute('style', 'position: relative; float: right; top: -23px; color: #5c2b20;');

    select.appendChild(input);
    select.appendChild(close);

    select_complete.appendChild(select);

    let options = document.createElement('div');
    options.classList.add('hidden');
    options.setAttribute('style', 'position: absolute; background: #5c2b20; border: 1px solid #ddab76; box-shadow: 0 0 3px #000; outline: 1px solid #000; color: #ddab76; max-height: 50vh; overflow: auto;');

    input.addEventListener('keyup', (event) => {
        let temp_input = input.value.replace(/\W*/gm, '');
        if (temp_input.length > 2) {
            options.classList.remove('hidden');
        } else if (!options.classList.contains('hidden')) {
            options.classList.add('hidden');
        }
    });

    close.addEventListener('click', () => {
        if (!options.classList.contains('hidden')) {
            options.classList.add('hidden');
        }
        input.value = '';
    });
    select_complete.appendChild(options);
    return select_complete;
}

// Module-level flag: ensures the global "close any open filter dropdown on
// outside click" listener is only ever registered once, regardless of how
// many times filters get (re)created across page navigations.
let mho_checkbox_dropdown_listener_attached = false;

/**
 * Enregistre une seule fois un listener global qui ferme tout volet de filtre ouvert
 * lors d'un clic en dehors de celui-ci. Évite l'accumulation de listeners à chaque
 * (re)création de filtres lors des navigations entre pages.
 */
export function ensureCheckboxDropdownGlobalListener() {
    if (mho_checkbox_dropdown_listener_attached) return;

    document.addEventListener('click', () => {
        document.querySelectorAll('.mho-checkbox-dropdown-panel').forEach((panel: any) => {
            panel.style.display = 'none';
        });
    });

    mho_checkbox_dropdown_listener_attached = true;
}

/**
 * Crée un filtre multi-valeurs sous forme de volet déroulant avec cases à cocher.
 * Le trigger est un véritable <select> (avec une seule option dynamique) afin de
 * récupérer gratuitement le style natif appliqué par le site aux <select>, sans
 * avoir à dupliquer ses couleurs dans notre CSS.
 * @param {string} labelText
 * @param {string} id
 * @param {{value: string, text: string}[]} options
 * @param {() => void} onChange
 * @returns {{ container: HTMLDivElement, getSelectedValues: () => string[] }}
 */
export function createCheckboxDropdown(labelText: string, id: string, options: any[], onChange: () => void) {
    ensureCheckboxDropdownGlobalListener();

    let container = document.createElement('div');
    container.classList.add('mho-filter-field');

    let label = document.createElement('label');
    label.innerText = labelText;
    label.classList.add('mho-filter-label');
    container.appendChild(label);

    let toggle = document.createElement('select');
    toggle.id = id;
    toggle.classList.add('mho-input', 'mho-dropdown-toggle');

    let toggleOption = document.createElement('option');
    toggle.appendChild(toggleOption);
    container.appendChild(toggle);

    let panel = document.createElement('div');
    panel.classList.add('mho-checkbox-dropdown-panel');
    container.appendChild(panel);

    let checkboxes: any[] = [];

    let updateToggleLabel = () => {
        let selectedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
        toggleOption.innerText = selectedCount === 0
            ? getI18N(texts.filter_all)
            : `${selectedCount} ${getI18N(texts.filter_selected_count)}`;
    };

    options.forEach(({value, text, icon}) => {
        let optionLine = document.createElement('div');

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = value;
        checkbox.id = `${id}-opt-${value}`;
        checkbox.classList.add('mho-input');

        let optionLabel = document.createElement('label');
        optionLabel.htmlFor = checkbox.id;
        optionLabel.title = text;

        if (icon) {
            let optionIcon = document.createElement('img');
            optionIcon.src = icon;
            optionIcon.alt = text;
            optionIcon.classList.add('mho-dropdown-option-icon');
            optionLabel.appendChild(optionIcon);
        } else {
            optionLabel.innerText = text;
        }

        checkbox.addEventListener('change', () => {
            updateToggleLabel();
            onChange();
        });

        optionLine.appendChild(checkbox);
        optionLine.appendChild(optionLabel);
        panel.appendChild(optionLine);
        checkboxes.push(checkbox);
    });

    let togglePanel = () => {
        let wasOpen = panel.style.display === 'block';
        document.querySelectorAll('.mho-checkbox-dropdown-panel').forEach((p: any) => {
            p.style.display = 'none';
        });
        panel.style.display = wasOpen ? 'none' : 'block';
    };

    // Bloque l'ouverture du volet natif du <select> ; on pilote nous-mêmes le panneau.
    toggle.addEventListener('mousedown', (event) => {
        event.preventDefault();
    });

    // Le 'click' (qui suit le mousedown) bubble normalement : stopPropagation empêche
    // le listener global document (fermeture des panneaux) de refermer celui qu'on ouvre.
    toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        toggle.focus();
        togglePanel();
    });

    toggle.addEventListener('keydown', (event) => {
        if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
            event.preventDefault();
            togglePanel();
        } else if (event.key === 'Escape') {
            (panel.style as any).display = 'none';
        }
    });

    panel.addEventListener('click', (event) => event.stopPropagation());

    updateToggleLabel();

    let syncPanelWidth = () => {
        panel.style.width = `${toggle.offsetWidth}px`;
    };

    // Le select peut changer de largeur quand son contenu texte change
    // (ex: "2 sélectionné(s)" vs "Tous"), donc on resynchronise le panel
    // à chaque redimensionnement plutôt qu'une seule fois au chargement.
    let toggleResizeObserver = new ResizeObserver(syncPanelWidth);
    toggleResizeObserver.observe(toggle);

    setTimeout(() => {
        let toggleComputedStyle = getComputedStyle(toggle);
        panel.style.backgroundColor = toggleComputedStyle.backgroundColor;
        panel.style.color = toggleComputedStyle.color;
        syncPanelWidth();
    }, 0);

    return {
        container,
        getSelectedValues: () => checkboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value),
        destroy: () => toggleResizeObserver.disconnect()
    };
}

/**
 * Crée un <select> simple avec son label dans un conteneur flex-column.
 * @param {string} labelText
 * @param {string} id
 * @param {{value: string, text: string}[]} options
 * @returns {{ container: HTMLDivElement, select: HTMLSelectElement }}
 */
export function createSingleFilterSelect(labelText: string, id: string, options: any[]) {
    let container = document.createElement('div');
    container.classList.add('mho-filter-field');

    let label = document.createElement('label');
    label.htmlFor = id;
    label.innerText = labelText;
    label.classList.add('mho-filter-label');
    container.appendChild(label);

    let select = document.createElement('select');
    select.id = id;
    select.classList.add('mho-input');

    options.forEach(({value, text}) => {
        let opt = document.createElement('option');
        opt.value = value;
        opt.innerText = text;
        select.appendChild(opt);
    });

    container.appendChild(select);
    return {container, select};
}
