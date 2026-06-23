import {getBank} from '../api/bank';
import {addItemToWishlist} from '../api/wishlist';
import {lang, mh_optimizer_window_id, repo_img_hordes_url} from '../config/constants';
import {texts} from '../i18n/texts';
import {state} from '../state';
import {createAdvancedProperties} from './tooltips';
import {getI18N} from '../utils/i18n';

export function displayBank(tab_id) {
    getBank().then((bank) => {
        if (bank) {
            displayItems(bank, tab_id);
        }
    });
}

/**
 * Affiche la liste des objets
 * @param filtered_items
 * @param {string} tab_id l'onglet dans lequel on se trouve
 */

export function displayItems(filtered_items, tab_id) {
    let tab_content = document.getElementById(mh_optimizer_window_id + '-tab-content');

    let item_list = document.createElement('ul');
    item_list.id = 'item-list';

    tab_content.appendChild(item_list);

    filtered_items?.forEach((item, index) => {
        if (index === 0 || filtered_items[index - 1].category.idCategory !== item.category.idCategory) {
            let category_text = document.createElement('span');
            category_text.innerText = item.category.label[lang];

            let category_container = document.createElement('div');
            category_container.classList.add('mho-category', 'mho-header');
            category_container.appendChild(category_text);

            item_list.appendChild(category_container);
        }

        let item_title_and_add_container = document.createElement('div');
        item_title_and_add_container.classList.add('item-title');

        let item_title_container = document.createElement('div');
        item_title_container.setAttribute('style', 'flex: 1; cursor: pointer;');
        item_title_and_add_container.appendChild(item_title_container)

        if ((tab_id === 'bank' || tab_id === 'items') && item.wishListCount === 0 && state.mh_user.townDetails?.townId) {
            let item_add_to_wishlist = document.createElement('div');
            item_add_to_wishlist.classList.add('add-to-wishlist');
            item_title_and_add_container.appendChild(item_add_to_wishlist);

            let add_to_wishlist_button = document.createElement('button');
            add_to_wishlist_button.classList.add('inline');
            add_to_wishlist_button.addEventListener('click', () => {
                addItemToWishlist(item).then((wishlist) => {
                    item_add_to_wishlist.remove();
                });
            })

            let img = document.createElement('img');
            img.src = `${repo_img_hordes_url}item/item_cart.gif`;
            img.alt = '&#x1F6D2;';
            add_to_wishlist_button.appendChild(img);
            item_add_to_wishlist.appendChild(add_to_wishlist_button);
        }

        let icon_container = document.createElement('span');
        icon_container.setAttribute('style', 'margin-right: 0.5em');
        item_title_container.appendChild(icon_container);

        let item_icon = document.createElement('img');
        if (item.broken) {
            item_icon.style.border = '1px dashed red';
        }
        item_icon.src = repo_img_hordes_url + item.img;
        icon_container.appendChild(item_icon);

        if (tab_id === 'bank' && item.bankCount > 1) {
            let item_count = document.createElement('span');
            item_count.setAttribute('style', 'vertical-align: sub; font-size: 10px;')
            item_count.innerText = item.bankCount;
            icon_container.appendChild(item_count);
        }

        let item_title = document.createElement('span');
        item_title.classList.add('label_text');
        item_title.innerText = getI18N(item.label) + (item.broken ? ' (' + getI18N(texts.broken) + ')' : '');
        item_title_container.appendChild(item_title);

        let item_properties_container = document.createElement('div');
        item_properties_container.classList.add('properties');

        item_properties_container.innerHTML = `<span class="small">${getI18N(item.description)}</span>`;

        createAdvancedProperties(item_properties_container, item, undefined);

        let item_container = document.createElement('li');
        item_container.appendChild(item_title_and_add_container);
        item_container.appendChild(item_properties_container);

        item_title_container.addEventListener('click', () => {
            let selected_items = document.getElementsByClassName('selected');
            item_container.classList.toggle('selected');
        });

        item_list.appendChild(item_container);
    });
}

/** Affiche le calcul des probabilités en camping */
