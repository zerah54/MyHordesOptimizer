import {hordes_img_url} from '../config/constants';
import {status_list} from '../i18n/texts';
import {state} from '../state';

export function getTooltipItem(img, isStatus) {
    let hovered_item;
    let hovered_status;

    if (img && img.src) {
        if (!isStatus) {
            hovered_item = getItemFromImg(img.src);
        } else {
            hovered_status = getStatusFromImg(img.src);
        }
    }

    return {
        item: hovered_item,
        status: hovered_status,
        alt: img?.alt
    };
}


export function getClickedItem(target) {
    let item_icon = event.target.closest('span.item-icon') || event.target.previousElementSibling?.closest('span.item-icon') || event.target.previousElementSibling?.querySelector('span.item-icon');
    if (item_icon) {
        let hovered_item = getItemFromImg(item_icon.querySelector('img').src);
        let broken = item_icon.parentElement.classList.contains('broken');
        return {item: hovered_item, broken: broken};
    }
}


export function getFixedImagePath(img_src) {
    const index = img_src.indexOf(hordes_img_url);
    if (index === -1) {
        console.warn(`Image source "${img_src}" does not include '${hordes_img_url}' as expected.`, img_src);
        return;
    }
    return img_src
        .slice(index + hordes_img_url.length)
        .replace(/\/(.+)\.(\w+?)\.(\w+?)$/, '/$1.$3');
}


export function getItemFromImg(img_src) {
    if (img_src) {
        const img_path = getFixedImagePath(img_src);
        return state.items?.find((item) => item.img === img_path);
    }
}


export function getStatusFromImg(img_src) {
    if (img_src) {
        const img_path = getFixedImagePath(img_src);
        return status_list.find((status) => status.img === img_path);
    }
}
