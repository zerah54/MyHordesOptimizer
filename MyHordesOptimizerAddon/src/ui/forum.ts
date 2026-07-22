import { lang, mh_optimizer_icon, mho_blacklist_key } from '../config/constants';
import { fill_items_messages_pool } from '../data/fill-items-messages';
import { state } from '../state';
import { pageIsDesert, pageIsForum, pageIsMsgReceived } from '../utils/page';
import { getStorageItem, setStorageItem } from '../utils/storage';

export function fillItemsMessages() {
    if (state.mho_parameters.fill_items_messages && pageIsMsgReceived()) {
        const row_send = document.querySelector('#rows-send');
        if (!row_send) return;

        const sendable_items = row_send.querySelector('.sendable-items');
        if (!sendable_items) return;

        const editor_block = document.querySelector('#pm-forum-editor');
        if (!editor_block) return;

        setTimeout(() => {

            const editor = editor_block.querySelector('hordes-twino-editor');
            if (!editor) return;

            const sendable_items_item = sendable_items.querySelectorAll('li.item');
            Array.from(sendable_items_item).forEach((item) => {
                item.addEventListener('click', () => {
                    const message_title = editor.querySelector('input');
                    const message_content = editor.querySelector('textarea');
                    if ((message_title.value === undefined || message_title.value === null || message_title.value === '')
                        && (message_content.value === undefined || message_content.value === null || message_content.value === '')) {
                        const lang_fillers = fill_items_messages_pool[lang];
                        const random_filler = lang_fillers[Math.floor(Math.random() * lang_fillers.length)];

                        message_title.setAttribute('value', random_filler.title);
                        message_title.dispatchEvent(new Event('input', { bubbles: true }));

                        message_content.value = random_filler.content;
                        message_content.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }, { once: true });
            });
        }, 250);
    }
}


export function blockUsersPosts() {
    if (state.mho_parameters.block_users && pageIsForum()) {
        const posts = document.querySelectorAll('.forum-post');
        if (posts) {
            Array.from(posts).forEach((post) => {
                let blacklisted_user = post.querySelector('#blacklist');
                const user = post.querySelector('.username');
                const user_id = user.getAttribute('x-user-id');
                if (user_id === state.mh_user.id.toString()) return;

                getStorageItem(mho_blacklist_key).then((blacklist) => {
                    if (!blacklist) {
                        blacklist = [];
                    }

                    const is_user_in_blacklist = blacklist.some((blacklist_user_id) => blacklist_user_id === user_id);
                    const original_post_content = post.querySelector('.forum-post-content:not(.replace-original)');
                    let new_post_content = post.querySelector('.replace-original');

                    if (!blacklisted_user) {
                        blacklisted_user = document.createElement('span');
                        blacklisted_user.id = 'blacklist';
                        blacklisted_user.innerHTML = '&#10003;';
                        blacklisted_user.style.marginRight = '0.5em';
                        blacklisted_user.style.cursor = 'pointer';
                        blacklisted_user.addEventListener('click', () => {
                            getStorageItem(mho_blacklist_key).then((keys) => {
                                const temp_blacklist = [...keys];
                                if (!blacklisted_user.getAttribute('blacklisted')) {
                                    temp_blacklist.push(user_id);
                                    blacklisted_user.setAttribute('blacklisted', 'true');
                                    const user_posts = Array.from(document.querySelectorAll(`.username[x-user-id="${user_id}"]`) || []).map((user_tag) => user_tag.parentElement.parentElement.querySelector('.original'));
                                    user_posts.forEach((user_post) => user_post.classList.remove('force-display'));
                                } else {
                                    const index = temp_blacklist.findIndex((blacklisted_user_id) => blacklisted_user_id === user_id);
                                    if (index > -1) {
                                        temp_blacklist.splice(index, 1);
                                        blacklisted_user.removeAttribute('blacklisted');
                                    }
                                }
                                setStorageItem(mho_blacklist_key, [...temp_blacklist]);
                                getStorageItem(mho_blacklist_key).then((new_blacklist) => {
                                    blacklist = [...new_blacklist];
                                });
                            });
                        });

                        user.parentNode.insertBefore(blacklisted_user, user);
                    }

                    if (is_user_in_blacklist) {
                        blacklisted_user.innerHTML = '&#10007;';
                        blacklisted_user.setAttribute('blacklisted', 'true');
                        original_post_content.classList.add('original');
                        if (!original_post_content.classList.contains('force-display')) {
                            original_post_content.style.display = 'none';
                        }


                        if (!new_post_content) {
                            new_post_content = document.createElement('div');
                            new_post_content.classList.add('forum-post-content', 'replace-original');
                            const link = document.createElement('a');
                            link.innerText = 'Cliquez ici pour afficher ce message.';
                            link.style.cursor = 'pointer';
                            link.addEventListener('click', ($event) => {
                                new_post_content.style.display = 'none';
                                original_post_content.style.display = 'block';
                                original_post_content.classList.add('force-display');
                            });
                            new_post_content.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 30px !important; vertical-align: middle; margin-right: 0.5em;"><i>L'utilisateur a été bloqué.</i><br />`;
                            new_post_content.appendChild(link);
                            original_post_content.parentNode.insertBefore(new_post_content, original_post_content);
                        } else {
                            if (!original_post_content.classList.contains('force-display')) {
                                new_post_content.style.display = 'block';
                            }
                        }
                    } else {
                        blacklisted_user.innerHTML = '&#10003;';
                        blacklisted_user.removeAttribute('blacklisted');

                        if (new_post_content) {
                            new_post_content.style.display = 'none';
                        }
                        original_post_content.style.display = 'block';
                    }
                });
            });
        }
    }
}


export function displayCountCharacters() {

    let counter = document.querySelector('#mho_registry_counter_id');

    if (!counter && state.mho_parameters.display_counter_on_input_registry && pageIsDesert()) {
        const log_block = document.querySelector('#beyond-log');
        if (!log_block) return;

        const log_input = log_block.querySelector('.overlay-central input');
        if (!log_input) return;

        counter = document.createElement('div');
        counter.id = 'mho_registry_counter_id';
        counter.classList.add('cell', 'grow-0', 'small');
        counter.style.margin = 'auto';
        counter.innerText = `${log_input.value.length}/256`;

        log_input.parentElement?.parentElement?.parentElement?.parentElement?.parentNode.insertBefore(counter, log_input.parentElement.parentElement.parentElement.parentElement.nextSibling);
        log_input.addEventListener('input', (event) => {
            counter.innerText = `${event.srcElement.value?.trim().length ?? 0}/256`;
        });

        log_input.addEventListener('change', (event) => {
            const log_block_new = document.querySelector('#beyond-log');
            const log_input_new = log_block_new.querySelector('.overlay-central input');
            counter.innerText = `${log_block_new.value?.trim().length ?? 0}/256`;
        });
    } else if (counter) {
        counter.remove();
    }
}

/////////////////////////////////////
// BOUTONS SUR LES OUTILS EXTERNES //
/////////////////////////////////////
