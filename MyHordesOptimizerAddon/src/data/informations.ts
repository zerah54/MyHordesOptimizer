import {gm_mh_external_app_id_key, mho_version_key, repo_img_url} from '../config/constants';
import {texts} from '../i18n/texts';
import {state} from '../state';
import {getI18N} from '../utils/i18n';
import {getStorageItem, setStorageItem} from '../utils/storage';
import {showChangelogModal} from '../ui/window';
import {
    getChangelog,
    getScriptInfo,
    isNewVersion,
    isScript,
    isScriptVersionLastVersion,
    toggleNewChangelog
} from '../utils/version';

import type {InformationDefinition} from '../types';

export let informations: InformationDefinition[] = [
    {
        id: `version`,
        label: {
            en: `Changelog ${getScriptInfo().version}`,
            fr: `Notes de version ${getScriptInfo().version}`,
            de: `Changelog ${getScriptInfo().version}`,
            es: `Notas de la versión ${getScriptInfo().version}`
        },
        src: undefined,
        action: () => {
            getStorageItem(mho_version_key).then((version) => {
                if (isNewVersion(version)) {
                    showChangelogModal(getChangelog(), () => {
                        version[getScriptInfo().version] = true;
                        toggleNewChangelog(false);
                        setStorageItem(mho_version_key, version);
                    });
                } else {
                    showChangelogModal(getChangelog());
                }
            });
        },
        img: `emotes/rptext.gif`
    },
    {
        id: `update`,
        label: {
            en: `Update available`,
            fr: `Mise à jour disponible`,
            de: `Update verfügbar`,
            es: `Actualización disponible`
        },
        src: isScript() ? getScriptInfo().updateURL : undefined,
        action: undefined,
        img: `icons/small_news.gif`,
        display: () => isScript() && !isScriptVersionLastVersion()
    },
    {
        id: `discord-url-id`,
        label: {
            en: `Bugs? Ideas?`,
            fr: `Des bugs ? Des idées ?`,
            de: `Fehler ? Ideen ?`,
            es: `¿Bugs? ¿Ideas?`
        },
        src: `https://discord.gg/ZQH7ZPWcCm`,
        action: undefined,
        img: `${repo_img_url}discord.ico`
    },
    {
        id: `edit-app-id`,
        label: {
            en: `Change my external ID for apps`,
            fr: `Modifier mon ID externe pour les apps`,
            de: `Meine externe ID für externe Programme ändern`,
            es: `Cambiar mi ID externo para las aplicaciones`
        },
        src: undefined,
        action: () => {
            let manual_app_id_key = prompt(getI18N(texts.edit_add_app_id_key), state.external_app_id);

            if (manual_app_id_key !== null && manual_app_id_key !== undefined && manual_app_id_key !== '') {
                state.external_app_id = manual_app_id_key;
                setStorageItem(gm_mh_external_app_id_key, state.external_app_id);
            } else if (manual_app_id_key === '') {
                state.external_app_id = undefined;
                setStorageItem(gm_mh_external_app_id_key, undefined);
            }
        },
        img: `icons/small_remove.gif`
    }
];

export const table_ruins_headers = [
    {id: 'img', label: {en: ``, fr: ``, de: ``, es: ``}, type: 'th'},
    {id: 'label', label: {en: `Name`, fr: 'Nom', de: `Name`, es: `Nombre`}, type: 'th'},
    {
        id: 'description',
        label: {en: `Description`, fr: `Description`, de: `Beschreibung`, es: `Descripción`},
        type: 'td'
    },
    {
        id: 'minDist',
        label: {en: `Minimum distance`, fr: `Distance minimum`, de: `Mindestabstand`, es: `Distancia mínima`},
        type: 'td'
    },
    {
        id: 'maxDist',
        label: {en: `Maximum distance`, fr: `Distance maximum`, de: `Maximale Entfernung`, es: `Distancia máxima`},
        type: 'td'
    },
    {
        id: 'camping',
        label: {en: `Camping bonus`, fr: `Bonus en camping`, de: `Campingbonus`, es: `Bono de acampada`},
        type: 'td'
    },
    {
        id: 'capacity',
        label: {en: `Capacity`, fr: `Capacité`, de: `Kapazität`, es: `Capacidad`},
        type: 'td'
    },
    {id: 'drops', label: {en: `Items`, fr: 'Objets', de: `Gegenstände`, es: `Objetos`}, type: 'td'},
];

export const added_ruins = [
    {id: '-1000', camping: 0, label: {en: `None`, fr: `Aucun`, de: `Kein`, es: `Ninguna`}}
];

export const town_type = [
    {id: 'rne', label: {de: 'Kleine Stadt', en: 'Small Town', es: 'Amateur', fr: 'Petite carte'}},
    {id: 're', label: {de: 'Entfernte Regionen', en: 'Distant Region', es: 'Leyenda', fr: 'Région éloignée'}},
    {id: 'pande', label: {de: 'Pandämonium', en: 'Pandemonium', es: 'Pandemonio', fr: 'Pandémonium'}}
];

