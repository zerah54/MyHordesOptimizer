import { lang, mh_optimizer_icon, mho_blacklist_key } from '../config/constants';
import { fill_items_messages_pool } from '../data/fill-items-messages';
import { state } from '../state';
import { findLinkInsertionPoint, type LinkInsertionPoint } from '../utils/forum-link-insertion';
import { pageIsDesert, pageIsForum, pageIsMsgReceived } from '../utils/page';
import { unwatchRendered, watchRendered } from '../utils/render-watch';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { type MatchedVideo, matchVideoLink } from '../utils/video-providers';

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


/** Longueur maximale d'une entrée de registre, imposée par le jeu */
const registry_max_length: number = 256;

export function displayCountCharacters() {
    const counter = document.querySelector('#mho_registry_counter_id');

    if (!state.mho_parameters.display_counter_on_input_registry || !pageIsDesert()) {
        unwatchRendered('registry-counter');
        counter?.remove();
        return;
    }

    /**
     * Le journal est un composant rendu par le jeu : son champ de saisie n'existe pas
     * encore quand les initialisations sont rejouées. On se cale donc sur son rendu,
     * ce qui couvre aussi ses remplacements ultérieurs.
     */
    watchRendered('registry-counter', 'hordes-log', displayCountCharacters);

    /**
     * Déjà en place : il n'y a rien à refaire.
     * La version précédente retirait ici le compteur — la condition de création portant
     * un `!counter`, tout rejeu des initialisations le faisait tomber dans la branche de
     * suppression. Il disparaissait donc un passage sur deux, et notamment à chaque
     * `mh-current-log-update`, c'est-à-dire au moment même où l'on écrit dans le registre.
     */
    if (counter) return;

    const log_input: HTMLInputElement | null = document.querySelector('#beyond-log .overlay-central input');
    if (!log_input) return;

    const new_counter: HTMLDivElement = document.createElement('div');
    new_counter.id = 'mho_registry_counter_id';
    new_counter.classList.add('cell', 'grow-0', 'small');
    new_counter.style.margin = 'auto';

    const refreshCount = (): void => {
        new_counter.innerText = `${log_input.value?.trim().length ?? 0}/${registry_max_length}`;
    };
    refreshCount();

    /** Le champ est enfoui de quelques niveaux dans la grille du journal ; on insère le compteur juste après ce bloc */
    const input_block: HTMLElement | null | undefined = log_input.parentElement?.parentElement?.parentElement?.parentElement;
    if (!input_block?.parentNode) return;

    input_block.parentNode.insertBefore(new_counter, input_block.nextSibling);

    log_input.addEventListener('input', refreshCount);
    log_input.addEventListener('change', refreshCount);
}

/////////////////////////////////////
// BOUTONS SUR LES OUTILS EXTERNES //
/////////////////////////////////////

//////////////////////////////////////
// OPTIONS DE LECTURE DU FORUM       //
//////////////////////////////////////

/** Clé de surveillance du conteneur des posts, pour l'ouverture forcée des sections repliées */
const collapse_expand_watch_key: string = 'forum-collapse-expand';

/**
 * Force l'ouverture d'une section repliée sans balise de langue.
 * Les sections `[lang_xx]` ne sont jamais touchées : une fois `data-processed="1"` posé par
 * le jeu, leur état est déjà correct (ouvert pour la langue de session, fermé sinon) — les
 * forcer ouvrir afficherait des variantes dans une langue étrangère.
 */
function expandForumCollapseSections(): void {
    const collapsors: HTMLElement[] = Array.from(document.querySelectorAll('.forum-post-content .collapsor[data-processed="1"]'));

    collapsors.forEach((collapsor: HTMLElement) => {
        if (collapsor.dataset.lang || collapsor.dataset.mhoForumForced) return;

        collapsor.dataset.mhoForumForced = '1';
        if (collapsor.dataset.open === '1') return;

        const collapsed: Element | null = collapsor.nextElementSibling;
        if (!(collapsed instanceof HTMLElement) || !collapsed.classList.contains('collapsed')) return;

        collapsor.dataset.open = '1';
        collapsed.style.maxHeight = '';
        collapsed.style.opacity = '1';
    });
}

/** Referme les sections que l'on a forcées ouvertes ; celles refermées manuellement entre-temps ne sont pas retouchées */
function revertForcedForumCollapseSections(): void {
    const collapsors: HTMLElement[] = Array.from(document.querySelectorAll('.forum-post-content .collapsor[data-mho-forum-forced]'));

    collapsors.forEach((collapsor: HTMLElement) => {
        delete collapsor.dataset.mhoForumForced;
        if (collapsor.dataset.open !== '1') return;

        const collapsed: Element | null = collapsor.nextElementSibling;
        if (!(collapsed instanceof HTMLElement) || !collapsed.classList.contains('collapsed')) return;

        collapsor.dataset.open = '0';
        collapsed.style.maxHeight = '0';
        collapsed.style.opacity = '0';
    });
}

/**
 * Déplie automatiquement les sections repliées des posts du forum en lecture.
 * Rejouée à chaque (re)rendu du conteneur des posts via `watchRendered` : le passage ne
 * modifie que des attributs/styles (jamais la liste des enfants), donc pas de risque de
 * boucle avec l'observateur de mutations.
 */
export function autoExpandForumCollapseSections(): void {
    const is_enabled: boolean = !!(state.mho_parameters?.forum_options && state.mho_parameters?.forum_auto_expand_collapse);

    if (!is_enabled) {
        unwatchRendered(collapse_expand_watch_key);
        revertForcedForumCollapseSections();
        return;
    }

    watchRendered(collapse_expand_watch_key, '.forum-posts', expandForumCollapseSections);
}

/** Un seul écouteur de clic délégué est posé sur `document`, jamais retiré (le contenu du forum est remplacé en entier à chaque navigation, un écouteur posé dessus serait perdu) */
let spoiler_click_listener_attached: boolean = false;

/** Bascule l'épinglage du spoiler cliqué, sauf si le clic visait un lien qu'il contient */
function onForumSpoilerClick(event: MouseEvent): void {
    if (!(state.mho_parameters?.forum_options && state.mho_parameters?.forum_pin_spoiler_on_click)) return;

    const target: HTMLElement | null = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;

    const spoiler: HTMLElement | null = target.closest('.forum-post-content .spoiler');
    if (!spoiler) return;

    const nearest_link: HTMLElement | null = target.closest('a');
    if (nearest_link && spoiler.contains(nearest_link)) return;

    spoiler.classList.toggle('mho-spoiler-pinned');
}

/**
 * Active/désactive l'épinglage au clic des spoilers du forum. Le comportement natif au
 * survol n'est jamais modifié ; l'option ajoute uniquement la possibilité de fixer un
 * spoiler affiché en cliquant dessus (un ancêtre `a` du clic annule le basculement, pour ne
 * pas épingler par effet de bord un clic sur un lien révélé à l'intérieur).
 */
export function pinForumSpoilersOnClick(): void {
    if (!spoiler_click_listener_attached) {
        document.addEventListener('click', onForumSpoilerClick);
        spoiler_click_listener_attached = true;
    }

    const is_enabled: boolean = !!(state.mho_parameters?.forum_options && state.mho_parameters?.forum_pin_spoiler_on_click);
    document.body.classList.toggle('mho-spoiler-pin-enabled', is_enabled);

    if (is_enabled) return;

    document.querySelectorAll('.forum-post-content .spoiler.mho-spoiler-pinned').forEach((spoiler: Element) => {
        spoiler.classList.remove('mho-spoiler-pinned');
    });
}

/** Extensions d'image reconnues sur le `pathname` d'un lien (insensible à la casse, tolère un `?query` en suffixe) */
const image_url_pattern: RegExp = /\.(jpe?g|png|gif|webp|svg|bmp)$/i;
/** Classe commune aux blocs image et vidéo injectés après un lien */
const forum_media_block_class: string = 'mho-forum-media-block';
/** Classe de la légende commune aux blocs image et vidéo */
const forum_media_caption_class: string = 'mho-forum-media-caption';
/** Classe du bloc image injecté après un lien, pour le retrouver et le retirer si l'option est décochée */
const forum_image_block_class: string = 'mho-forum-image-block';

/** true si le `pathname` de l'URL (pas le href brut, pour tolérer un `?v=...`) se termine par une extension d'image connue */
function isForumImageLink(href: string): boolean {
    try {
        return image_url_pattern.test(new URL(href, document.baseURI).pathname);
    } catch {
        return false;
    }
}

/** Construit le bloc image + légende optionnelle à insérer après le lien d'origine */
function buildForumImageBlock(href: string, caption: string | null): HTMLElement {
    const wrapper: HTMLElement = document.createElement('div');
    wrapper.classList.add(forum_media_block_class, forum_image_block_class);

    const link: HTMLAnchorElement = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const img: HTMLImageElement = document.createElement('img');
    img.loading = 'lazy';
    img.addEventListener('error', () => wrapper.remove(), { once: true });
    img.src = href;

    link.appendChild(img);
    wrapper.appendChild(link);

    if (caption) {
        const caption_element: HTMLElement = document.createElement('div');
        caption_element.classList.add(forum_media_caption_class);
        caption_element.textContent = caption;
        wrapper.appendChild(caption_element);
    }

    return wrapper;
}

/**
 * Squelette commun de `displayForumLinkImages` et `displayForumLinkVideos` :
 * parcourt les liens non encore marqués, appelle `matchAndBuild` pour chacun,
 * et insère le bloc résultant au bon endroit (enchaîné si consécutif).
 */
function processForumMediaLinks(
    is_enabled: boolean,
    block_class: string,
    checked_data_attr: string,
    matchAndBuild: (href: string, caption: string | null) => HTMLElement | null,
): void {
    if (!is_enabled) {
        document.querySelectorAll(`.forum-post-content .${block_class}`).forEach((block: Element) => block.remove());
        document.querySelectorAll<HTMLElement>(`.forum-post-content a[${checked_data_attr}]`).forEach((link: HTMLElement) => {
            link.removeAttribute(checked_data_attr);
        });
        return;
    }

    const links: HTMLAnchorElement[] = Array.from(document.querySelectorAll(`.forum-post-content a[href]:not([${checked_data_attr}])`));
    /** Deux liens média consécutifs partageant le même point d'insertion : on chaîne sur le dernier bloc posé là, pas sur le point d'origine à chaque fois, pour garder l'ordre du texte */
    const last_inserted_at_node: Map<HTMLElement, HTMLElement> = new Map();

    links.forEach((link: HTMLAnchorElement) => {
        link.setAttribute(checked_data_attr, '1');

        const href: string = link.getAttribute('href') ?? '';
        const link_text: string = (link.textContent ?? '').trim();
        const caption: string | null = link_text !== '' && link_text !== href ? link_text : null;

        const block: HTMLElement | null = matchAndBuild(href, caption);
        if (!block) return;

        const insertion_point: LinkInsertionPoint = findLinkInsertionPoint(link);
        const previous_block: HTMLElement | undefined = last_inserted_at_node.get(insertion_point.node);

        if (previous_block) {
            previous_block.insertAdjacentElement('afterend', block);
        } else {
            insertion_point.node.insertAdjacentElement(insertion_point.position, block);
        }

        last_inserted_at_node.set(insertion_point.node, block);
    });
}

/**
 * Affiche l'image sous chaque lien de post pointant vers un fichier image, sans jamais
 * supprimer le lien texte d'origine. Rejouée à chaque navigation via `initOptionsWithoutLoginNeeded`
 * (pas de `watchRendered` ici : ce passage insère des nœuds, l'observer bouclerait sur ses
 * propres insertions).
 */
export function displayForumLinkImages(): void {
    const is_enabled: boolean = !!(state.mho_parameters?.forum_options && state.mho_parameters?.forum_auto_display_images);
    processForumMediaLinks(is_enabled, forum_image_block_class, 'data-mho-image-checked', (href, caption) => {
        if (!isForumImageLink(href)) return null;
        return buildForumImageBlock(href, caption);
    });
}

/** Classe du bloc vidéo injecté après un lien, pour le retrouver et le retirer si l'option est décochée */
const forum_video_block_class: string = 'mho-forum-video-block';

/** Vignette de secours (logo générique + icône lecture) : état de chargement ET repli en cas d'échec réseau */
function buildGenericVideoPlaceholder(): HTMLElement {
    const placeholder: HTMLElement = document.createElement('div');
    placeholder.classList.add('mho-forum-video-placeholder');
    return placeholder;
}

/**
 * Construit le bloc vignette + légende optionnelle à insérer après le lien d'origine ; le clic sur
 * la vignette bascule vers l'iframe du fournisseur. La vignette est un vrai `<a>` : ctrl/clic-molette
 * ouvre la vidéo dans un nouvel onglet, et la bordure hérite ainsi de la couleur de lien du thème du
 * jeu (`currentColor`) au lieu de la couleur de texte ambiante.
 */
function buildForumVideoBlock(matched: MatchedVideo, href: string, caption: string | null): HTMLElement {
    const wrapper: HTMLElement = document.createElement('div');
    wrapper.classList.add(forum_media_block_class, forum_video_block_class);

    const thumbnail: HTMLAnchorElement = document.createElement('a');
    thumbnail.classList.add('mho-forum-video-thumbnail');
    thumbnail.href = href;
    thumbnail.target = '_blank';
    thumbnail.rel = 'noopener noreferrer';

    if (matched.provider.getThumbnailUrl) {
        const img: HTMLImageElement = document.createElement('img');
        img.loading = 'lazy';
        img.addEventListener('error', () => {
            img.remove();
            thumbnail.prepend(buildGenericVideoPlaceholder());
        }, { once: true });
        img.src = matched.provider.getThumbnailUrl(matched.videoId);
        thumbnail.appendChild(img);
    } else {
        const placeholder: HTMLElement = buildGenericVideoPlaceholder();
        thumbnail.appendChild(placeholder);

        matched.provider.resolveThumbnailUrl?.(matched.videoId).then((thumbnail_url: string | undefined) => {
            if (!thumbnail_url || !placeholder.isConnected) return;
            const img: HTMLImageElement = document.createElement('img');
            img.loading = 'lazy';
            img.src = thumbnail_url;
            placeholder.replaceWith(img);
        });
    }

    const play_icon: HTMLElement = document.createElement('span');
    play_icon.classList.add('mho-forum-video-play-icon-overlay');
    thumbnail.appendChild(play_icon);

    thumbnail.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();

        const iframe: HTMLIFrameElement = document.createElement('iframe');
        iframe.src = matched.provider.getEmbedUrl(matched.videoId);
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;

        const a: HTMLAnchorElement = document.createElement('a');
        a.appendChild(iframe);
        wrapper.replaceChild(a, thumbnail);
    }, { once: true });

    wrapper.appendChild(thumbnail);

    if (caption) {
        const caption_element: HTMLElement = document.createElement('div');
        caption_element.classList.add(forum_media_caption_class);
        caption_element.textContent = caption;
        wrapper.appendChild(caption_element);
    }

    return wrapper;
}

/**
 * Affiche une vignette cliquable sous chaque lien de post pointant vers une vidéo YouTube ou
 * Dailymotion, sans jamais supprimer le lien texte d'origine. Même principe de rejeu que
 * `displayForumLinkImages` (pas de `watchRendered`, s'appuie sur le rejeu de navigation SPA).
 */
export function displayForumLinkVideos(): void {
    const is_enabled: boolean = !!(state.mho_parameters?.forum_options && state.mho_parameters?.forum_auto_display_videos);
    processForumMediaLinks(is_enabled, forum_video_block_class, 'data-mho-video-checked', (href, caption) => {
        const matched: MatchedVideo | null = matchVideoLink(href);
        if (!matched) return null;
        return buildForumVideoBlock(matched, href, caption);
    });
}
