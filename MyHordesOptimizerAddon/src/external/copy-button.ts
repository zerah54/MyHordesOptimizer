import {mh_optimizer_icon, mho_copy_map_id, mho_map_key} from '../config/constants';
import {texts} from '../i18n/texts';
import {getI18N} from '../utils/i18n';
import {getStorageItem, setStorageItem} from '../utils/storage';

export function createCopyButton(source, map, map_id, button_block_id) {
    let copy_button_parent = document.getElementById(button_block_id);
    let copy_button = document.createElement('button');
    let copyText = (text, add) => {
        return `<img src="${mh_optimizer_icon}" style="margin: auto; vertical-align: middle;" width="20" height="20"><span style="margin: auto; vertical-align: middle;">${text}<br /><small>${add}</small></span>`;
    }
    copy_button.setAttribute('style', 'max-width: initial; float: right');
    copy_button.innerHTML = copyText(getI18N(texts.copy_map), '');
    copy_button.id = mho_copy_map_id;
    copy_button.addEventListener('click', () => {
        copy_button.disabled = true;
        let map_to_convert = document.getElementById(map_id);
        if (source === 'fm') {
            map = document.querySelector('#ruinmap-wrapper') && document.querySelector('#ruinmap-wrapper')?.offsetParent === null ? 'map' : 'ruin';
            map_to_convert = map === 'ruin' ? document.getElementById('ruinmap') : document.getElementById('map');
        }
        getStorageItem(mho_map_key).then((mho_map) => {
            setStorageItem(mho_map_key, {
                source: source,
                map: map,
                block: (source === 'fm' || source === 'gh') && map === 'map' ? map_to_convert.outerHTML : undefined,
                ruin: map === 'ruin' ? map_to_convert.outerHTML : undefined
            });
        });

        copy_button.innerHTML = copyText(getI18N(texts.copy_map_end), getI18N(texts.copy_map_end_more));

        setTimeout(() => {
            copy_button.innerHTML = copyText(getI18N(texts.copy_map), '');
        }, 5000)
        copy_button.disabled = false;
    });
    copy_button_parent.appendChild(copy_button);
}
