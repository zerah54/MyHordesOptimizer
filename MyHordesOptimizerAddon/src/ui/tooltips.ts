import {lang, repo_img_hordes_url, supported_languages} from '../config/constants';
import {status_texts, wishlist_depot, wishlist_headers} from '../i18n/texts';
import {state} from '../state';
import {getRecipeElement} from './recipes';
import {getWishlistForZone} from './wishlist';
import {getI18N} from '../utils/i18n';
import {getFixedImagePath, getTooltipItem} from '../utils/item-lookup';

export function enhanceTooltip(tooltip_container) {
    if (!tooltip_container) return;

    // Identifier l'objet actuellement dans le tooltip natif
    let img = tooltip_container.querySelector('h1 > img:last-child');
    const isStatus = !img;

    if (isStatus) {
        const label = tooltip_container.querySelector('h1')?.textContent.trim();
        img = document.querySelector(`li.status > img[alt="${label}"]`);
    }

    if (!img) return;

    const imgPath = getFixedImagePath(img.src);
    if (!imgPath) return;

    // Vérifier si le tooltip amélioré existant correspond déjà au bon objet
    const existing = tooltip_container.querySelector('.mho-advanced-tooltip');
    if (existing) {
        if (existing.getAttribute('x-icon-path') === imgPath) {
            // Déjà enrichi avec le bon objet, rien à faire
            return;
        }
        // Le tooltip a été réutilisé par MH pour un autre objet : on nettoie
        existing.remove();
        const existingHints = tooltip_container.querySelectorAll('.mho-shift-hint, .mho-close-hint');
        existingHints.forEach(el => el.remove());
    }

    tooltip_container.addEventListener('click', (e) => e.stopImmediatePropagation());

    let item_or_status = getTooltipItem(img, isStatus);
    let item = item_or_status.item;
    let status = item_or_status.status;

    if (!item && !status) return;

    const buildAdvancedTooltipContainer = () => {
        const c = document.createElement('div');
        c.classList.add('mho-advanced-tooltip');
        c.setAttribute('x-icon-path', imgPath);
        return c;
    };

    let advanced_tooltip_container;

    if (item) {
        let item_deco = tooltip_container.getElementsByClassName('item-tag-deco')[0];
        let should_display = state.mho_parameters.enhanced_tooltips && state.mho_parameters.enhanced_tooltips_items && (
            (state.mho_parameters.enhanced_tooltips_item_quantities && tooltip_container) ||
            (state.mho_parameters.enhanced_tooltips_item_properties && item.properties) ||
            (state.mho_parameters.enhanced_tooltips_item_actions && item.actions) ||
            (state.mho_parameters.enhanced_tooltips_item_recipes && item.recipes.length > 0) ||
            state.mho_parameters.enhanced_tooltips_item_translations ||
            (item_deco && item.deco > 0));

        if (should_display) {
            advanced_tooltip_container = buildAdvancedTooltipContainer();
            createAdvancedProperties(advanced_tooltip_container, item, tooltip_container);
        }
    } else {
        let should_display = state.mho_parameters.enhanced_tooltips && state.mho_parameters.enhanced_tooltips_statuses && (
            status.watch_def !== undefined || status.watch_kills !== undefined ||
            status.searches !== undefined || status.terror !== undefined ||
            status.fatal_infection !== undefined || status.prevent_infection !== undefined ||
            status.properties?.length > 0);

        if (should_display) {
            advanced_tooltip_container = buildAdvancedTooltipContainer();
            createAdvancedStatus(advanced_tooltip_container, status, tooltip_container);
        }
    }

    if (advanced_tooltip_container) {
        tooltip_container.appendChild(advanced_tooltip_container);
        addFreezeHintsToTooltip(tooltip_container);
    }
}


export function addFreezeHintsToTooltip(tooltip_container) {
    if (tooltip_container.querySelector('.mho-shift-hint')) return;

    const h1 = tooltip_container.querySelector('h1');
    if (!h1) return;

    if (!h1.classList.contains('flex')) {
        h1.classList.add('flex');
    }

    const shift = document.createElement('kbd');
    shift.classList.add('mho-shift-hint');
    shift.innerText = `⇧`;

    const close = document.createElement('img');
    close.classList.add('mho-close-hint');
    close.src = `${repo_img_hordes_url}icons/b_close.png`;
    close.alt = `close`;

    const separator = document.createElement('div');
    separator.style.flex = '1';

    h1.prepend(shift, close, separator);
}


export function observeNewTooltips(tries = 10) {
    if (state.advanced_tooltips_observer) return;
    const tooltip_container = document.querySelector('#tooltip_container');
    if (!tooltip_container) {
        if (tries > 0) {
            setTimeout(observeNewTooltips, 100, tries - 1);
        } else {
            console.warn('tooltip_container not found');
        }
        return;
    }
    state.advanced_tooltips_observer = new MutationObserver((records, observer) => {
        for (const record of records) {
            for (const node of record.addedNodes) {
                if (node instanceof HTMLElement && node.classList.contains('item')) {
                    enhanceTooltip(node);
                }
            }
            const tooltipItem = record.target.closest?.('.item');
            if (tooltipItem && !record.addedNodes.length) {
                enhanceTooltip(tooltipItem);
            }
        }
    });
    state.advanced_tooltips_observer.observe(tooltip_container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style']
    });
}

/** Affiche les tooltips avancés */

export function displayAdvancedTooltips() {
    if (state.mho_parameters.enhanced_tooltips && state.items) {
        initTooltipFreezeOnShift()
        // observation des bulles qui apparaîtront plus tard
        observeNewTooltips();
        // traitement des bulles déjà présentes
        document.querySelectorAll('#tooltip_container > .item').forEach(function (element) {
            enhanceTooltip(element);
        });
    }
}


export function initTooltipFreezeOnShift() {
    if ((initTooltipFreezeOnShift as any)._initialized) return;
    (initTooltipFreezeOnShift as any)._initialized = true;

    let frozenTooltip = null;
    let freezeObserver = null;
    let frozenStyle = null;

    function setHintFrozen(tooltip_container, frozen) {
        const close = tooltip_container?.querySelector('.mho-close-hint');
        if (!close) return;

        close.addEventListener('click', (e) => {
            e.stopPropagation();
            unfreeze();
        }, {once: true});
    }

    function unfreeze() {
        if (!frozenTooltip) return;
        setHintFrozen(frozenTooltip, false);
        freezeObserver?.disconnect();
        freezeObserver = null;
        const tooltip = frozenTooltip;
        frozenTooltip = null;
        frozenStyle = null;
        tooltip.removeAttribute('style');
        tooltip.classList.remove('mho-frozen');
    }

    function freezeCurrentTooltip() {
        const container = document.getElementById('tooltip_container');
        if (!container) return;

        let hint = container.querySelector('.mho-shift-hint');
        if (!hint) return;

        const visibleTooltip = [...container.querySelectorAll('.item')].find(el => el.style.display === 'block');
        if (!visibleTooltip) return;

        if (visibleTooltip === frozenTooltip) return;

        unfreeze();

        visibleTooltip.classList.add('mho-frozen');
        frozenTooltip = visibleTooltip;
        frozenStyle = frozenTooltip.getAttribute('style');

        setHintFrozen(frozenTooltip, true);

        freezeObserver = new MutationObserver(() => {
            if (frozenTooltip && frozenTooltip.style.display !== 'block') {
                frozenTooltip.setAttribute('style', frozenStyle);
            }
        });

        freezeObserver.observe(frozenTooltip, {attributes: true, attributeFilter: ['style']});
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') {
            freezeCurrentTooltip();
        }
    });
}


export function createAdvancedProperties(content, item, tooltip) {
    let item_deco;
    if (tooltip) {
        item_deco = tooltip.getElementsByClassName('item-tag-deco')[0];
    }
    content.innerHtml = '';

    if (tooltip && state.mho_parameters.enhanced_tooltips_item_quantities) {
        let stock_div = document.createElement('div');
        content.appendChild(stock_div);
        stock_div.style.display = 'flex';
        stock_div.style.flexWrap = 'wrap';
        stock_div.style.justifyContent = 'space-between';
        stock_div.style.columnGap = '1em';
        stock_div.style.borderBottom = '1px solid white';

        let bank_div = document.createElement('div');
        bank_div.style.width = 'calc(50% - 0.5em)';
        bank_div.innerText = getI18N(wishlist_headers.find((header) => header.id === 'bank_count').label) + ' : ' + item.bankCount;
        stock_div.appendChild(bank_div);

        let wishlist_for_zone = getWishlistForZone();
        let item_in_wishlist = wishlist_for_zone?.find((iwfz) => item.id === iwfz.item.id);

        if (item_in_wishlist?.item.wishListCount > 0) {
            let wishlist_wanted_div = document.createElement('div');
            wishlist_wanted_div.style.width = 'calc(50% - 0.5em)';
            wishlist_wanted_div.innerText = getI18N(wishlist_headers[5].label) + ' : ' + item_in_wishlist.item.wishListCount;
            stock_div.appendChild(wishlist_wanted_div);

            let wishlist_depot_div = document.createElement('div');
            wishlist_depot_div.style.width = 'calc(50% - 0.5em)';
            wishlist_depot_div.innerText = getI18N(wishlist_headers[2].label) + ' : ' + getI18N(wishlist_depot.find((depot) => item_in_wishlist.depot === depot.value).label);
            stock_div.appendChild(wishlist_depot_div);
        }
    }

    if (state.mho_parameters.enhanced_tooltips_item_translations) {
        let translations = '';
        supported_languages.filter((language) => language.value !== lang).forEach((language) => {
            translations += `<div class="tooltip-translation"><span class="tooltip-translation-flag">${language.img}</span><span class="tooltip-translation-value">${item.label[language.value]}</span></div>`
        });
        let item_translations = document.createElement('div');
        item_translations.classList.add('mho-tooltip-translations');
        item_translations.innerHTML = translations;
        content.appendChild(item_translations);
    }

    if ((!item_deco || item.deco === 0) && !item.properties && !item.actions && item.recipes.length === 0) return;

    if (item_deco && item.deco > 0) {
        let text = item_deco.innerText.replace(/ \(.*\)*/, '');
        item_deco.innerHTML = `<span>${text} <em>( +${item.deco} )</em></span>`;
    }

    if (!item.properties && !item.actions && item.recipes.length === 0) return;

    if (state.mho_parameters.enhanced_tooltips_item_properties && item.properties) {
        let item_properties = document.createElement('div');
        content.appendChild(item_properties);
        item.properties.forEach((property) => {
            item_properties.appendChild(displayPropertiesOrActions(property, item));
        });
    }

    if (state.mho_parameters.enhanced_tooltips_item_actions && item.actions) {
        let item_actions = document.createElement('div');
        content.appendChild(item_actions);
        item.actions.forEach((action) => {
            item_actions.appendChild(displayPropertiesOrActions(action, item));
        });
    }

    if (state.mho_parameters.enhanced_tooltips_item_recipes && item.recipes.length > 0) {
        let item_recipes = document.createElement('table');
        item_recipes.classList.add('recipes');
        content.appendChild(item_recipes);
        item.recipes.forEach((recipe) => {
            item_recipes.appendChild(getRecipeElement(recipe));
        });
    }
}


export function createAdvancedStatus(content, status, tooltip) {
    content.innerHtml = '';
    let status_details = document.createElement('div');
    content.appendChild(status_details);

    const have_properties = status.properties?.length > 0;

    if (status.pdc === undefined && status.watch_def === undefined
        && status.watch_kills === undefined && status.searches === undefined
        && !have_properties) return;

    if (status.pdc !== undefined) {
        let status_detail = document.createElement('div');
        status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
        status_detail.innerHTML = `${status.pdc} ${Math.abs(status.pdc) > 1 ? 'points' : 'point'} de contrôle supplémentaire${Math.abs(status.pdc) > 1 ? 's' : ''}`;
        status_details.appendChild(status_detail);
    }
    if (status.terror !== undefined) {
        let status_detail = document.createElement('div');
        status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
        status_detail.innerHTML = `${getI18N(status_texts.terror)} : ${status.terror}%`;
        status_details.appendChild(status_detail);
    }
    if (status.prevent_infection !== undefined) {
        let status_detail = document.createElement('div');
        status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
        status_detail.innerHTML = `${getI18N(status_texts.prevent_infection)} : ${status.prevent_infection * 100}%`;
        status_details.appendChild(status_detail);
    }
    if (status.fatal_infection !== undefined) {
        let status_detail = document.createElement('div');
        status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
        status_detail.innerHTML = `${getI18N(status_texts.fatal_infection)} : ${status.fatal_infection < 0 ? status.fatal_infection * 100 : '+' + status.fatal_infection * 100}%`;
        status_details.appendChild(status_detail);
    }

    if (status.watch_def !== undefined || status.watch_kills !== undefined) {
        if (status.watch_def !== undefined) {
            let status_detail = document.createElement('div');
            status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
            status_detail.innerHTML = `${getI18N(status_texts.zombies_killed)} : ${status.watch_def}`;
            status_details.appendChild(status_detail);
        }
        if (status.watch_kills !== undefined) {
            let status_detail = document.createElement('div');
            status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
            status_detail.innerHTML = `${getI18N(status_texts.watch_survival_chances)} : ${status.watch_kills < 0 ? status.watch_kills * 100 : '+' + status.watch_kills * 100}%`;
            status_details.appendChild(status_detail);
        }
    }

    if (status.searches !== undefined) {
        let status_detail = document.createElement('div');
        status_detail.classList.add('item-tag', 'mho-item-tag', 'mho-item-tag-no-img');
        status_detail.innerHTML = `${getI18N(status_texts.success_digs_changes)} : ${status.searches}`;
        status_details.appendChild(status_detail);
    }

    if (have_properties) {
        status.properties.forEach((property) => {
            status_details.appendChild(displayStatusProperties(property, status));
        });
    }
}

/** Affiche les propriétés ou les actions associées à l'objet survolé */

export function displayPropertiesOrActions(property_or_action, hovered_item) {
    let item_action = document.createElement('div');
    // TODO MAPPING BACK
    item_action.classList.add('item-tag', 'mho-item-tag');
    switch (property_or_action) {
        case 'eat_6ap':
        case 'eat_7ap':
        case 'eat_4ap':
            item_action.classList.add(`item-tag-food`);
            item_action.innerHTML = `+${property_or_action.slice(4, 5)}<img src="${repo_img_hordes_url}emotes/ap.${lang}.gif">`;
            break;
        case 'coffee':
            item_action.classList.add(`item-tag-coffee`);
            item_action.innerHTML = `+4<img src="${repo_img_hordes_url}emotes/ap.${lang}.gif">`;
            break;
        case 'drug_6ap_1':
        case 'drug_8ap_1':
            item_action.classList.add(`item-tag-drug`);
            item_action.innerHTML = `+${property_or_action.slice(5, 6)}<img src="${repo_img_hordes_url}emotes/ap.${lang}.gif">`;
            break;
        case 'alcohol':
            item_action.classList.add(`item-tag-alcohol`);
            item_action.innerHTML = `+6<img src="${repo_img_hordes_url}emotes/ap.${lang}.gif">`;
            break;
        case 'cyanide':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerHTML = `<img src="${repo_img_hordes_url}emotes/death.gif">`;
            break;
        case 'hero_find':
            item_action.classList.add(`item-tag-hero`);
            item_action.innerText = `Trouvaille`;
            break;
        case 'hero_find_lucky':
            if (!(hovered_item.properties && hovered_item.properties.some((property) => property === 'hero_find')) && !(hovered_item.actions && hovered_item.actions.some((property) => property === 'hero_find'))) {
                item_action.classList.add(`item-tag-hero`);
                item_action.innerText = `Jolie trouvaille`
            } else {
                item_action.classList.remove('item-tag', 'mho-item-tag');
            }
            break;
        case 'hero_find_lucky2':
            if (!(hovered_item.properties && hovered_item.properties.some((property) => property === 'hero_find_lucky')) && !(hovered_item.actions && hovered_item.actions.some((property) => property === 'hero_find_lucky'))) {
                item_action.classList.add(`item-tag-hero`);
                item_action.innerText = `Impressionnante trouvaille`
            } else {
                item_action.classList.remove('item-tag', 'mho-item-tag');
            }
            break;
        case 'hero_find_lucky3':
            if (!(hovered_item.properties && hovered_item.properties.some((property) => property === 'hero_find_lucky2')) && !(hovered_item.actions && hovered_item.actions.some((property) => property === 'hero_find_lucky2'))) {
                item_action.classList.add(`item-tag-hero`);
                item_action.innerText = `Incroyable trouvaille`;
            } else {
                item_action.classList.remove('item-tag', 'mho-item-tag');
            }
            break;
        case 'flash_photo_1': {
            item_action.classList.add(`mho-item-tag-large`);
            let fail_1 = Math.round(60 / 90 * 100);
            item_action.innerText = `${100 - fail_1}% de chances de pouvoir fuir pendant 30 secondes`;
            break;
        }
        case 'flash_photo_2': {
            item_action.classList.add(`mho-item-tag-large`);
            let fail_2 = Math.round(30 / 90 * 100);
            item_action.innerText = `${100 - fail_2}% de chances de pouvoir fuir pendant 60 secondes`;
            break;
        }
        case 'flash_photo_3': {
            item_action.classList.add(`mho-item-tag-large`);
            let fail_3 = 1;
            item_action.innerText = `Succès : ${100 - fail_3}% de chances de pouvoir fuir pendant 120 secondes`;
            break;
        }
        case 'flash_photo_4': {
            item_action.classList.add(`mho-item-tag-large`);
            let fail_4 = 1;
            item_action.innerText = `Succès : ${100 - fail_4}% de chances de pouvoir fuir pendant 120 secondes`;
            break;
        }
        case 'can_cook':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerText = `Peut être cuisiné`;
            break;
        case 'pet':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerText = `Animal`;
            break;
        case 'can_poison':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerText = `Peut être empoisonné`;
            break;
        case 'camp_bonus':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerText = `Dans le sac, augmente de 5% les chances de survie en camping`;
            break;
        case 'load_maglite':
        case 'load_lamp':
        case 'load_pilegun':
        case 'load_radio':
        case 'load_dildo':
        case 'load_lpointer':
        case 'load_mixergun':
        case 'load_taser':
        case 'load_chainsaw':
        case 'load_pilegun3':
        case 'load_pilegun2':
        case 'load_emt':
        case 'load_rmk2':
            item_action.classList.add(`item-tag-load`);
            item_action.innerText = `Peut être rechargé`;
            break;
        case 'smokebomb':
            item_action.classList.add(`item-tag-smokebomb`);
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerHTML = `Efface les entrées du registre (-3 minutes)<br />Dissimule votre prochaine entrée (+1 minute)`;
            break;
        case 'improve':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerText = `Permet d'aménager un campement`;
            break;
        case 'defence':
            // déjà affichés par le jeu
            item_action.classList.remove('item-tag', 'mho-item-tag');
            break;
        case 'drug_6ap_2':
        case 'drug_8ap_2':
            // ne pas afficher
            item_action.classList.remove('item-tag', 'mho-item-tag');
            break;
        case 'hero_surv_1':
            if (state.mh_user.townDetails) {
                var days = state.mh_user.townDetails?.day;
                var devastated = state.mh_user.townDetails?.isDevaste;
                var chances = 1;
                if (days >= 20) {
                    chances = 0.50;
                } else if (days >= 15) {
                    chances = 0.60;
                } else if (days >= 13) {
                    chances = 0.70;
                } else if (days >= 10) {
                    chances = 0.80;
                } else if (days >= 5) {
                    chances = 0.85;
                }
                if (devastated) chances = Math.max(0.1, chances - 0.2);
                var success = chances * 100;
                item_action.classList.add(`mho-item-tag-no-img`);
                item_action.innerText = `${success}% de chances de réussir son manuel`;
            } else {
                item_action.classList.remove('item-tag', 'mho-item-tag');
            }
            break;
        case 'hero_surv_2':
            // ne pas afficher
            item_action.classList.remove('item-tag', 'mho-item-tag');
            break;
        case 'prevent_night':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerText = `Malus de nuit divisé par 4`;
            break;
        case 'no_post':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerText = `Ne peut pas être envoyé par message`;
            break;
        case 'wagging_flag':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerText = `Attire 2.5% des zombies du débordement`;
            break;
        case 'fragile':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerText = `Se casse en cas d'envoi par catapulte`;
            break;
        case 'esc_fixed':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerText = `Ne peut pas être déposé par le chef d'escorte`;
            break;
        case 'impoundable':
            item_action.classList.add(`mho-item-tag-no-img`);
            item_action.innerText = `Perdu en cas de bannissement`;
            break;
        case 'box_opener':
        case 'can_opener':
        case 'parcel_opener':
        case 'nw_ikea':
        case 'nw_armory':
        case 'ressource':
        case 'food':
        case 'weapon':
        case 'drug':
        case 'nw_trebuchet':
        case 'slaughter_2xs':
        case 'throw_animal_cat':
        case 'throw_animal_cat_t1':
        case 'throw_animal_cat_t2':
        case 'throw_animal_tekel':
        case 'throw_animal_tekel_t1':
        case 'throw_animal_tekel_t2':
        case 'parcel_opener_h':
        case 'hero_tamer_3':
        case 'throw_b_chair_basic':
        case 'throw_b_machine_1':
        case 'throw_b_machine_2':
        case 'throw_b_machine_3':
        case 'cuddle_teddy_1':
        case 'cuddle_teddy_2':
        case 'lock':
        case 'home_store_plus2':
        case 'home_store_plus':
        case 'home_def_plus':
        case 'throw_b_pc':
        case 'slaughter_bmb':
        case 'throw_animal_angryc':
        case 'special_guitar':
        case 'fire_pilegun':
        case 'fire_taser':
        case 'fill_asplash1':
        case 'fill_asplash2':
        case 'throw_b_screw':
        case 'throw_b_wrench':
        case 'throw_b_staff':
        case 'throw_b_knife':
        case 'throw_b_small_knife':
        case 'throw_b_cutter':
        case 'throw_b_can_opener':
        case 'fill_grenade1':
        case 'fill_grenade2':
        case 'fill_splash1':
        case 'fill_splash2':
        case 'fill_ksplash1':
        case 'fill_ksplash2':
        case 'fire_pilegun3':
        case 'throw_b_chain':
        case 'nw_shooting':
        case 'fire_splash3':
        case 'throw_b_torch_off':
        case 'throw_boomfruit':
        case 'throw_animal_dog':
        case 'throw_animal_dog_t1':
        case 'throw_animal_dog_t2':
        case 'throw_b_concrete_wall':
        case 'drug_xana1':
        case 'drug_xana2':
        case 'drug_xana3':
        case 'drug_xana4':
        case 'bandage':
        case 'drug_hyd_1':
        case 'drug_hyd_2':
        case 'drug_hyd_3':
        case 'drug_hyd_4':
        case 'drug_hyd_5':
        case 'drug_hyd_6':
        case 'drug_rand_1':
        case 'drug_rand_2':
        case 'drug_par_1':
        case 'drug_par_2':
        case 'drug_par_3':
        case 'drug_par_4':
        case 'prevent_terror':
        case 'read_rp_cover':
        case 'found_poisoned':
        case 'is_water':
        case 'water_tl0':
        case 'water_tl1a':
        case 'water_tl1b':
        case 'water_tl2':
        case 'water_g':
        case 'can':
        case 'can_t1':
        case 'can_t2':
        case 'can_t3':
        case 'open_doggybag':
        case 'special_dice':
        case 'slaughter_2x':
        case 'throw_animal':
        case 'throw_animal_t1':
        case 'throw_animal_t2':
        case 'slaughter_4xs':
        case 'repair_2':
        case 'zonemarker_1':
        case 'nessquick':
        case 'bomb_2':
        case 'repair_1':
        case 'light_cig':
        case 'poison_1':
        case 'poison_2':
        case 'bp_bunker_2':
        case 'fire_mixergun':
        case 'fire_chainsaw':
        case 'throw_b_lawn':
        case 'throw_b_cutcut':
        case 'throw_b_swiss_knife':
        case 'fill_jsplash':
        case 'throw_grenade':
        case 'throw_projector':
        case 'throw_exgrenade':
        case 'fill_exgrenade1':
        case 'fill_exgrenade2':
        case 'fire_asplash3':
        case 'fire_asplash2':
        case 'fire_asplash1':
        case 'throw_jerrygun':
        case 'throw_b_bone':
        case 'fire_splash2':
        case 'fire_splash1':
        case 'fire_asplash5':
        case 'fire_asplash4':
        case 'fire_pilegun2':
        case 'throw_phone':
        case 'fire_ksplash':
        case 'fire_lpointer4':
        case 'fire_lpointer3':
        case 'fire_lpointer2':
        case 'fire_lpointer1':
        case 'throw_hurling_stick':
        case 'open_metalbox':
        case 'open_metalbox_t1':
        case 'open_metalbox_t2':
        case 'open_metalbox2':
        case 'open_metalbox2_t1':
        case 'open_metalbox2_t2':
        case 'open_toolbox':
        case 'open_toolbox_t1':
        case 'open_toolbox_t2':
        case 'open_c_chest':
        case 'open_gamebox':
        case 'open_letterbox':
        case 'open_justbox':
        case 'open_matbox3':
        case 'open_matbox2':
        case 'open_matbox1':
        case 'open_h_chest':
        case 'open_postbox':
        case 'open_lunchbag':
        case 'open_drugkit':
        case 'open_safe':
        case 'open_abox':
        case 'open_asafe':
        case 'open_catbox':
        case 'open_catbox_t1':
        case 'open_catbox_t2':
        case 'open_xmasbox3':
        case 'open_xmasbox2':
        case 'open_xmasbox1':
        case 'open_postbox_xl':
        case 'throw_b_torch':
        case 'pumpkin':
        case 'drug_beta_bad_1':
        case 'drug_beta_bad_2':
        case 'drug_beta':
        case 'ghoul_serum':
        case 'drug_lsd_1':
        case 'drug_lsd_2':
        case 'drug_april_1':
        case 'drug_april_2':
        case 'eat_meat_1':
        case 'eat_meat_2':
        case 'open_foodbox_in':
        case 'open_foodbox_out':
        case 'open_foodbox_in_t1':
        case 'open_foodbox_out_t1':
        case 'open_foodbox_in_t2':
        case 'open_foodbox_out_t2':
        case 'eat_bone_1':
        case 'eat_bone_2':
        case 'fill_watercan1':
        case 'watercan1_tl0':
        case 'watercan1_tl1a':
        case 'watercan1_tl1b':
        case 'watercan1_tl2':
        case 'watercan1_g':
        case 'fill_watercan2':
        case 'watercan2_tl0':
        case 'watercan2_tl1a':
        case 'watercan2_tl1b':
        case 'watercan2_tl2':
        case 'watercan2_g':
        case 'watercan3_tl0':
        case 'watercan3_tl1a':
        case 'watercan3_tl1b':
        case 'watercan3_tl2':
        case 'watercan3_g':
        case 'eat_fleshroom_1':
        case 'eat_fleshroom_2':
        case 'eat_cadaver_1':
        case 'eat_cadaver_2':
        case 'alcohol_dx':
        case 'water_no_effect':
        case 'potion_tl0a':
        case 'potion_tl0b':
        case 'potion_tl1a':
        case 'potion_tl1b':
        case 'potion_tl2':
        case 'potion_g':
        case 'potion_tl0a_immune':
        case 'potion_tl0b_immune':
        case 'potion_tl1a_immune':
        case 'potion_tl1b_immune':
        case 'potion_tl2_immune':
        case 'potion_g_immune':
        case 'drug_rand_xmas':
        case 'read_rp':
        case 'slaughter_4x':
        case 'vibrator':
        case 'jerrycan_1':
        case 'jerrycan_1b':
        case 'jerrycan_2':
        case 'jerrycan_3':
        case 'emt':
        case 'special_card':
        case 'flare':
        case 'zonemarker_2':
        case 'fill_watercan0':
        case 'bomb_1':
        case 'watercup_1':
        case 'watercup_1b':
        case 'watercup_2':
        case 'watercup_3':
        case 'read_banned_note':
        case 'throw_sandball':
        case 'bp_generic_1':
        case 'bp_generic_2':
        case 'bp_generic_3':
        case 'bp_generic_4':
        case 'open_cbox':
        case 'bp_hotel_2':
        case 'bp_hotel_3':
        case 'bp_hotel_4':
        case 'bp_bunker_3':
        case 'bp_bunker_4':
        case 'bp_hospital_2':
        case 'bp_hospital_3':
        case 'bp_hospital_4':
        case 'purify_soul':
        case 'clean_clothes':
        case 'hero_hunter_1':
        case 'hero_hunter_2':
        case 'hero_tamer_1':
        case 'hero_tamer_1b':
        case 'hero_tamer_2':
        case 'hero_tamer_2b':
        case 'alarm_clock':
        case 'inedible':
        case 'lure':
        case 'equip_shoe_first':
        case 'hero_dog_fetch':
        case 'nw_impact_cumul':
        case 'eat_apple':
        case 'drink_quantum_1':
        case 'drink_quantum_2':
        case 'drink_quantum_3':
        case 'play_soccer_1':
        case 'play_soccer_2':
        case 'nosteal':
        case 'install_garland':
        case 'uninstall_garland':
        case 'open_cellobox':
        case 'flash_photo_4_ruin_bp':
        case 'flash_photo_4_ruin_bp_free':
        case 'flash_photo_4_ruin_no_bp':
        case 'repair_hero':
        case 'equip_bike_first':
        case 'unequip_bike_first':
        case 'pet_doggo':
        case 'jerrycan_4':
        case 'jerrycan_4b':
        case 'hero_tamer_4':
        case 'hero_tamer_4b':
        case 'hero_tamer_5':
        case 'hero_tamer_5b':
        case 'hero_tamer_6':
        case 'hero_tamer_6b':
        case 'hero_tamer_7':
        case 'hero_tamer_7b':
        case 'hero_tamer_8':
        case 'hero_tamer_8b':
        case 'hero_tamer_9':
            item_action.classList.remove('item-tag', 'mho-item-tag');
            break;
        case 'deco':
        case 'single_use':
            /** Déjà géré par MH */
            item_action.classList.remove('item-tag', 'mho-item-tag');
            break;
        case null:
            item_action.classList.remove('item-tag', 'mho-item-tag');
            break;
        default:
            console.warn('missing property or action', property_or_action);
            item_action.classList.remove('item-tag', 'mho-item-tag');
            break;
    }
    return item_action;
}


export function displayStatusProperties(status_properties, hovered_item) {
    let item_action = document.createElement('div');
    item_action.classList.add('item-tag', 'mho-item-tag');
    switch (status_properties) {
        case 'head_wounded':
            item_action.classList.add('mho-item-tag-no-img');
            item_action.innerText = getI18N(status_texts.head_wounded);
            break;
        case 'hand_wounded':
            item_action.classList.add('mho-item-tag-no-img');
            item_action.innerText = getI18N(status_texts.hand_wounded);
            break;
        case 'arm_wounded':
            item_action.classList.add('mho-item-tag-no-img');
            item_action.innerText = getI18N(status_texts.arm_wounded);
            break;
        case 'leg_wounded':
            item_action.classList.add('mho-item-tag-no-img');
            item_action.innerText = getI18N(status_texts.leg_wounded);
            break;
        case 'wounded':
        case null:
            item_action.classList.remove('item-tag', 'mho-item-tag');
            break;
        default:
            console.log(status_properties);
            break;
    }
    return item_action;
}
