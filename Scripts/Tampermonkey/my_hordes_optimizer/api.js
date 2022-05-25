//////////////////////////////////////
// Les éléments récupérés via l'API //
//////////////////////////////////////

let items;
let ruins;
let recipes;
let citizens;
let hero_skills;
let wishlist;

////////////////////
// L'URL de L'API //
////////////////////

const api_url = 'https://myhordesoptimizerapi.azurewebsites.net/';
const api2_url = 'http://144.24.192.182';

////////////////
// Appels API //
////////////////

function getItems() {
    startLoading();
    GM_xmlhttpRequest({
        method: 'GET',
        url: api2_url + '/myhordesfetcher/items?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                items = response.response
                    .map((item) => {
                    item.category = getCategory(item.category)
                    return item;
                })
                    .sort((item_a, item_b) => {
                    if (item_a.category.ordering > item_b.category.ordering) {
                      return 1;
                    } else if (item_a.category.ordering === item_b.category.ordering) {
                      return 0;
                    } else {
                      return -1;
                    }
                });
                console.log('items', items);
                let wiki_btn = document.getElementById(wiki_btn_id);
                if (wiki_btn) {
                    wiki_btn.setAttribute('style', 'display: inherit');
                }
            } else {
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
        }
    });
}

async function getRuins() {
    return new Promise((resolve, reject) => {
        if (!ruins) {
            startLoading();
            GM_xmlhttpRequest({
                method: 'GET',
                url: api_url + 'myhordesfetcher/ruins?userKey=' + external_app_id,
                responseType: 'json',
                onload: function(response){
                    if (response.status === 200) {
                        ruins = response.response.sort((a, b) => {
                            if(a.label[temp_lang] < b.label[temp_lang]) { return -1; }
                            if(a.label[temp_lang] > b.label[temp_lang]) { return 1; }
                            return 0;
                        });
                        resolve(ruins);
                    } else {
                        addError(response);
                        reject(response);
                    }
                    endLoading();
                },
                onerror: function(error){
                    endLoading();
                    addError(error);
                    reject(error);
                }
            });
            endLoading();
        } else {
            resolve(ruins);
            endLoading();
        }
    })
}

/** Récupère les informations de la ville */
function getMe() {
    startLoading();
    GM_xmlhttpRequest({
        method: 'GET',
        url: api2_url + '/myhordesfetcher/me?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                mh_user = response.response;
                GM_setValue(mh_user_key, mh_user);

                getItems();

                if (mh_user.townId) {
                    getWishlist();
                }
            } else {
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
        }
    });
}

/** Récupère les informations de la ville */
async function getTown() {
    return new Promise((resolve, reject) => {
        startLoading();
        GM_xmlhttpRequest({
            method: 'GET',
            url: api2_url + '/myhordesfetcher/town?userKey=' + external_app_id,
            responseType: 'json',
            onload: function(response){
                if (response.status === 200) {
                    console.log('town', response.response);
                    resolve(response.response);
                } else {
                    addError(response);
                    reject(response);
                }
                endLoading();
            },
            onerror: function(error){
                endLoading();
                addError(error);
                reject(error);
            }
        });
    });
}


/** Récupère les informations de la ville */
async function getCitizens() {
    return new Promise((resolve, reject) => {
        getHeroSkills().then((hero_skills) => {
            startLoading();
            GM_xmlhttpRequest({
                method: 'GET',
                url: api2_url + '/myhordesfetcher/citizens?userKey=' + external_app_id,
                responseType: 'json',
                onload: function(response){
                    if (response.status === 200) {
                        citizens = response.response;
                        citizens.citizens = Object.keys(citizens.citizens).map((key) => citizens.citizens[key])
                        resolve(citizens);
                    } else {
                        addError(response);
                        reject(citizens);
                    }
                    endLoading();
                },
                onerror: function(error){
                    endLoading();
                    addError(error);
                    reject(error);
                }
            });
        });
    });
}

/** Récupère les informations de la banque */
async function getBank() {
    return new Promise((resolve, reject) => {
        startLoading();
        GM_xmlhttpRequest({
            method: 'GET',
            url: api2_url + '/myhordesfetcher/bank?userKey=' + external_app_id,
            responseType: 'json',
            onload: function(response){
                if (response.status === 200) {
                    let bank = response.response;
                    bank.bank = Object.keys(bank.bank).map((key) => bank.bank[key])
                        .map((bank_info) => {
                        bank_info.item.category = getCategory(bank_info.item.category);
                        bank_info.item.count = bank_info.count;
                        bank_info.item.wishListCount = bank_info.wishListCount;
                        bank_info = bank_info.item;
                        return bank_info;
                    })
                        .sort((item_a, item_b) => {
                        if (item_a.category.ordering > item_b.category.ordering) {
                            return 1;
                        } else if (item_a.category.ordering === item_b.category.ordering) {
                            return 0;
                        } else {
                            return -1;
                        }
                    });
                    resolve(bank);
                } else {
                    addError(response);
                    reject(response);
                }
                endLoading();
            },
            onerror: function(error){
                endLoading();
                addError(error);
                reject(error);
            }
        });
    });
}

/** Récupère les informations de liste de course */
function getWishlist() {
    startLoading();
    GM_xmlhttpRequest({
        method: 'GET',
        url: api2_url + '/wishlist?userKey=' + external_app_id,
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                wishlist = response.response;
                wishlist.wishList = Object.keys(wishlist.wishList)
                    .map((key) => wishlist.wishList[key])
                    .sort((item_a, item_b) => item_b.priority > item_a.priority);
            } else {
                wishlist;
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
        }
    });
}

/**
  * Ajoute un élément à la wishlist
  * @param item l'élément à ajouter à la wishlist
  */
async function addItemToWishlist(item) {
    return new Promise((resolve, reject) => {
        startLoading();
        GM_xmlhttpRequest({
            method: 'POST',
            url: api2_url + '/wishlist/add/' + item.xmlId + '?userKey=' + external_app_id,
            responseType: 'json',
            onload: function(response){
                if (response.status === 200) {
                    item.wishListCount = 1;
                    resolve(item);
                    addSuccess(api_texts.add_to_wishlist_success[temp_lang]);
                } else {
                    addError(response);
                    reject(response);
                }
                endLoading();
            },
            onerror: function(error){
                endLoading();
                addError(error);
                reject(error);
            }
        });
    });
}

/** Met à jour les données de la wishlist */
function updateWishlist() {
    let item_list = wishlist.wishList
    .filter((item) => item.count)
    .map((item) => {
        return {id: item.item.xmlId, priority: item.priority, count: item.count};
    });
    startLoading();
    GM_xmlhttpRequest({
        method: 'PUT',
        url: api2_url + '/wishlist?userKey=' + external_app_id,
        data: JSON.stringify(item_list),
        responseType: 'json',
        headers: {
            'Content-Type': 'application/json'
        },
        onload: function(response){
            if (response.status === 200) {
                // TODO SNACKBAR
                wishlist = response.response;
                wishlist.wishList = Object.keys(wishlist.wishList).map((key) => wishlist.wishList[key]);

                addSuccess(api_texts.update_wishlist_success[temp_lang]);
            } else {
                addError(response);
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
        }
    });
}

/** Met à jour les outils externes (BBH, GH et Fata) en fonction des paramètres sélectionnés */
function updateExternalTools() {
    startLoading();
    let tools_to_update = {
        isBigBrothHordes: mho_parameters ? mho_parameters.update_bbh : false,
        isFataMorgana: mho_parameters ? mho_parameters.update_fata : false,
        isGestHordes: mho_parameters ? mho_parameters.update_gh : false
    };
    let btn = document.getElementById(mh_update_external_tools_id);
    GM_xmlhttpRequest({
        method: 'POST',
        url: api2_url + '/externaltools/update?userKey=' + external_app_id + '&userId=' + mh_user.id,
        data: JSON.stringify(tools_to_update),
        headers: {
            'Content-Type': 'application/json'
        },
        responseType: 'json',
        onload: function(response){
            if (response.status === 200) {
                if (response.response.bigBrothHordesStatus.toLowerCase() === 'ok') GM_setValue(gm_bbh_updated_key, true);
                if (response.response.fataMorganaStatus.toLowerCase() === 'ok') GM_setValue(gm_gh_updated_key, true);
                if (response.response.fataMorganaStatus.toLowerCase() === 'ok') GM_setValue(gm_fata_updated_key, true);

                let nb_tools_to_update = Object.keys(tools_to_update).map((key) => tools_to_update[key]).filter((tool) => tool).length;
                let response_items = Object.keys(response.response).map((key) => {return {key: key, value: response.response[key]}});
                let tools_success = response_items.filter((tool_response) => tool_response.value.toLowerCase() === 'ok');
                let tools_fail = response_items.filter((tool_response) => tool_response.value.toLowerCase() !== 'ok' && tool_response.value.toLowerCase() !== 'not activated');
                btn.innerHTML = nb_tools_to_update === tools_success.length ? '<img src ="' + repo_img_url + 'icons/done.png">' + texts.update_external_tools_success_btn_label[temp_lang]
                : `<img src ="${repo_img_url}emotes/warning.gif">${texts.update_external_tools_errors_btn_label[temp_lang]}<br>${tools_success.map((item) => item.key.replace('Status', ' : OK')).join('<br>')}<br>${tools_fail.map((item) => item.key.replace('Status', ' : KO')).join('<br>')}`;
            } else {
                addError(response);
                btn.innerHTML = '<img src ="' + repo_img_url + 'professions/death.gif">' + texts.update_external_tools_fail_btn_label[temp_lang];
            }
            endLoading();
        },
        onerror: function(error){
            endLoading();
            addError(error);
        }
    });
}

/** Récupère la liste complète des pouvoirs héros */
async function getHeroSkills() {
    return new Promise((resolve, reject) => {
        if (!hero_skills) {
            startLoading();
            GM_xmlhttpRequest({
                method: 'GET',
                url: api2_url + '/myhordesfetcher/heroSkills',
                responseType: 'json',
                onload: function(response){
                    if (response.status === 200) {
                        hero_skills = response.response.sort((a, b) => {
                            if (a.daysNeeded > b.daysNeeded) {
                                return 1;
                            } else if (a.daysNeeded === b.daysNeeded) {
                                return 0;
                            } else {
                                return -1;
                            }
                        });
                        resolve(hero_skills);
                    } else {
                        addError(response);
                        reject(response);
                    }
                    endLoading();
                },
                onerror: function(error){
                    endLoading();
                    addError(error);
                    reject(error);
                }
            });
        } else {
            resolve(hero_skills);
        }
    });
}


/** Récupère les traductions de la chaine de caractères */
function getTranslation(string_to_translate, source_language, block_to_display) {
    block_to_display.innerHTML = '';
    if (string_to_translate && string_to_translate !== '') {
        let locale = 'locale=' + source_language;
        let sourceString = 'sourceString=' + string_to_translate;
        startLoading();
        GM_xmlhttpRequest({
            method: 'GET',
            url: api2_url + '/myhordestranslation?' + locale + '&' + sourceString,
            responseType: 'json',
            onload: function(response){
                if (response.status === 200) {
                    let show_exact_match = response.response.translations.some((translation) => translation.key.isExactMatch);

                    if (show_exact_match) {
                        let display_all = document.createElement('div');
                        display_all.setAttribute('style', 'padding: 4px; border-bottom: 1px solid; cursor: pointer');
                        let display_all_img = document.createElement('img');
                        display_all_img.src = `${repo_img_url}/icons/small_more.gif`;
                        display_all_img.setAttribute('style', 'margin-right: 8px');

                        let display_all_text = document.createElement('text');
                        display_all_text.innerText = texts.display_all_search_result[temp_lang];

                        display_all.appendChild(display_all_img);
                        display_all.appendChild(display_all_text);
                        block_to_display.appendChild(display_all);

                        display_all.addEventListener('click', () => {
                            show_exact_match = !show_exact_match;
                            if (show_exact_match) {
                                display_all_img.src = `${repo_img_url}/icons/small_more.gif`;
                                display_all_text.innerHTML = texts.display_all_search_result[temp_lang];
                            } else {
                                display_all_img.src = `${repo_img_url}/icons/small_less.gif`;
                                display_all_text.innerHTML = texts.display_exact_search_result[temp_lang];
                            }
                            let not_exact = Array.from(block_to_display.getElementsByClassName('not-exact'));
                            not_exact.forEach((not_exact_item) => {
                                not_exact_item.classList.toggle('hidden');
                            })
                        });
                    }
                    response.response.translations
                        .forEach((translation) => {
                        if (response.response.translations.length > 1) {
                            let context_div = document.createElement('div');
                            context_div.setAttribute('style', 'text-align: center; padding: 4px; font-variant: small-caps; font-size: 14px;');
                            context_div.innerHTML = texts.translation_file_context[temp_lang] + ` <img src="${repo_img_url}/emotes/arrowright.gif"> ` + translation.key.context;
                            if (!translation.key.isExactMatch && show_exact_match) {
                                context_div.classList.add('not-exact','hidden');
                            }
                            block_to_display.appendChild(context_div);
                        }
                        let key_index = 0;
                        for (let lang_key in translation.value) {
                            let lang = translation.value[lang_key];
                            lang.forEach((result) => {
                                let content_div = document.createElement('div');
                                let img = document.createElement('img');
                                img.src = `${repo_img_url}/lang/${lang_key}.png`
                                img.setAttribute('style', 'margin-right: 8px');

                                let button_div = document.createElement('div');
                                let button = document.createElement('button');
                                button_div.appendChild(button);
                                button.innerHTML = '&#10697';
                                button.setAttribute('style', 'font-size: 16px');
                                button.addEventListener('click', () => {
                                    copyToClipboard(result);
                                });
                                content_div.setAttribute('style', 'display: flex; justify-content: space-between; padding: 6px;');

                                if (key_index === Object.keys(translation.value).length - 1) {
                                    content_div.setAttribute('style', 'display: flex; justify-content: space-between; padding: 6px; border-bottom: 1px solid;');
                                }
                                content_div.innerHTML = `<div>${img.outerHTML}${result}</div>`;
                                content_div.appendChild(button_div);

                                if (!translation.key.isExactMatch && show_exact_match) {
                                    content_div.classList.add('not-exact','hidden');
                                }
                                block_to_display.appendChild(content_div);
                            });
                            key_index ++;
                        };
                    });
                } else {
                    addError(response);
                }
                endLoading();
            },
            onerror: function(error){
                endLoading();
                addError(error);
            }
        });
    }
}

/** Récupère la liste complète des recettes */
async function getRecipes() {
    return new Promise((resolve, reject) => {
        if (!recipes) {
            startLoading();
            GM_xmlhttpRequest({
                method: 'GET',
                url: api2_url + '/myhordesfetcher/recipes',
                responseType: 'json',
                onload: function(response){
                    if (response.status === 200) {
                        recipes = response.response.map((recipe) => {
                            recipe.type = action_types.find((type) => type.id === recipe.type);
                            return recipe;
                        })
                            .sort((a, b) => {
                            if (a.type.ordering > b.type.ordering) {
                                return 1;
                            } else if (a.type.ordering === b.type.ordering) {
                                return 0;
                            } else {
                                return -1;
                            }
                        });
                        resolve(recipes);
                    } else {
                        addError(response);
                        reject(recipes);
                    }
                    endLoading();
                },
                onerror: function(error){
                    endLoading();
                    addError(error);
                    reject(error);
                }
            });
        } else {
            resolve(recipes);
        }
    });
}

/** Récupère la liste complète des recettes */
async function getTodayEstimation(day, estimations, today) {
    return new Promise((resolve, reject) => {
        startLoading();
        GM_xmlhttpRequest({
            method: 'POST',
            url: api2_url + `:8080/${today ? 'attaque' : 'planif'}.php?day=${day}&id=${mh_user.townId}&type=normal&debug=false`,
            data: JSON.stringify(estimations),
            responseType: 'text',
            onload: function(response){
                if (response.status === 200) {
                    resolve(response.response);
                } else {
                    addError(response);
                    reject(response);
                }
                endLoading();
            },
            onerror: function(error){
                endLoading();
                addError(error);
                reject(error);
            }
        });
    });
}

/** Récupère le chemin optimal à partir d'une carte */
async function getOptimalPath(map, html, button) {
    return new Promise((resolve, reject) => {
        map.doors = map.doors.slice(2);
        console.log('map before send', map);
        startLoading();
        GM_xmlhttpRequest({
            method: 'POST',
            data: JSON.stringify(map),
            url: api2_url + '/ruine/pathopti',
            responseType: 'json',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 3600000,
            onload: function(response){
                if (response.status === 200) {
                    resolve(response.reponse);
                } else {
                    addError(response);
                    reject(response);
                }
                endLoading();
            },
            onerror: function(error){
                console.error('error', error);
                endLoading();
                reject(error);
            }
        });
    });
}
