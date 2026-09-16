import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import type { MhoItem } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { displayAntiAbuseCounter } from './anti-abuse';

/** `pageIsBank()`/`pageIsWell()` lisent `document.URL` : mockées pour piloter le scénario banque */
vi.mock('../utils/page', () => ({
    pageIsBank: (): boolean => true,
    pageIsWell: (): boolean => false
}));

vi.mock('../utils/storage', () => ({
    getStorageItem: vi.fn(() => Promise.resolve(undefined)),
    setStorageItem: vi.fn(() => Promise.resolve())
}));

const normal_item: MhoItem = { id: 1, img: 'item/normal.png', label: { fr: 'Objet normal', en: '', de: '', es: '' } } as MhoItem;
const second_item: MhoItem = { id: 3, img: 'item/second.png', label: { fr: 'Second objet', en: '', de: '', es: '' } } as MhoItem;
const guardian_shield: MhoItem = { id: 2, img: 'item/shield.png', label: { fr: 'Bouclier du gardien', en: '', de: '', es: '' } } as MhoItem;

const RUCKSACK_ID: string = '111';
const BANK_ID: string = '222';

interface StoredCounterValue {
    item: { item: MhoItem; broken: boolean };
    take_at: number;
}

/**
 * Reproduit la vraie forme DOM d'un objet du sac (`SingleItem` du jeu) : sa propre ligne (jamais
 * fusionné en pastille à badge de quantité — ça n'existe que banque/bâtiment, cf.
 * `InventoryHandler::forceMoveItem`), avec une infobulle (`ItemTooltip`) rendue dans le même `<li>`
 * pour vérifier qu'on ne lit jamais `element.textContent` (pollué par l'infobulle).
 */
function rucksackItem(item: MhoItem, options: { locked?: boolean; broken?: boolean } = {}): HTMLLIElement {
    const locked: boolean = options.locked ?? false;
    const broken: boolean = options.broken ?? false;

    const li: HTMLLIElement = document.createElement('li');
    li.classList.add('item');
    if (locked) li.classList.add('locked');
    if (broken) li.classList.add('broken');

    const icon: HTMLSpanElement = document.createElement('span');
    icon.classList.add('item-icon');
    const img: HTMLImageElement = document.createElement('img');
    img.src = `https://cdn.example/build/images/${item.img}`;
    icon.appendChild(img);
    li.appendChild(icon);

    const tooltip: HTMLDivElement = document.createElement('div');
    tooltip.textContent = 'Texte d\'infobulle à ne jamais confondre avec la quantité';
    li.appendChild(tooltip);

    return li;
}

/** Reproduit la pastille de chargement du jeu (`<li class="item locked pending"/>`) : un objet listé dont le vault (icône/nom) n'a pas encore répondu — aucun `<img>`, invisible pour `readTrackedBagItems()` */
function pendingItemPlaceholder(): HTMLLIElement {
    const li: HTMLLIElement = document.createElement('li');
    li.classList.add('item', 'locked', 'pending');
    return li;
}

/** Métadonnées d'un transfert banque → sac réussi (`direction: 'up'`, `from` = banque, `to` = sac) — jamais le contenu de la réponse serveur */
function dispatchBankTakeSignal(overrides: Partial<{ from: number; to: number; direction: string }> = {}): void {
    document.documentElement.dispatchEvent(new CustomEvent('sig-item-transfer', {
        detail: { from: Number(BANK_ID), to: Number(RUCKSACK_ID), direction: 'up', ...overrides }
    }));
}

/** Métadonnées d'un dépôt sac → banque (`direction: 'down'`, `from` = sac, `to` = banque) — ignoré par l'écouteur `sig-item-transfer` (seule `direction: 'up'` est suivie), mais mute quand même le sac */
function dispatchBankDepositSignal(): void {
    document.documentElement.dispatchEvent(new CustomEvent('sig-item-transfer', {
        detail: { from: Number(RUCKSACK_ID), to: Number(BANK_ID), direction: 'down' }
    }));
}

/** Le sac (id du `dataset.inventoryAId`) vient de finir de charger côté jeu — seul `id` est lu, jamais le contenu (`inventory`) */
function dispatchRucksackLoadedSignal(): void {
    document.documentElement.dispatchEvent(new CustomEvent('sig-inventory-bag-loaded', {
        detail: { id: Number(RUCKSACK_ID) }
    }));
}

/** `requestAnimationFrame` n'existe pas nativement dans jsdom : simulé en `setTimeout` immédiat */
function flushAnimationFrame(): Promise<void> {
    return new Promise((resolve: () => void) => setTimeout(resolve, 0));
}

const setStorageItemMock: ReturnType<typeof vi.fn> = setStorageItem as unknown as ReturnType<typeof vi.fn>;
const getStorageItemMock: ReturnType<typeof vi.fn> = getStorageItem as unknown as ReturnType<typeof vi.fn>;

describe('displayAntiAbuseCounter — comptage des prises en banque (signal sig-item-transfer déclencheur, contenu lu en DOM)', () => {
    let rucksack: HTMLUListElement;

    beforeEach(() => {
        document.body.innerHTML = '';
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
        vi.stubGlobal('requestAnimationFrame', (callback: () => void) => setTimeout(callback, 0));

        state.items = [normal_item, guardian_shield, second_item];
        state.mho_parameters = { display_anti_abuse: true };
        state.mh_user = undefined;
        /**
         * NE PAS remettre `state.anti_abuse_controller` à `undefined` ici : c'est
         * `displayAntiAbuseCounter()` elle-même qui doit l'annuler (comme en prod) pour retirer
         * l'écouteur `sig-item-transfer` du test précédent — celui-ci reste sinon posé sur
         * `document.documentElement`, qui persiste entre les tests (contrairement à
         * `#bank-inventory`, recréé à chaque fois), et continuerait à réagir aux signaux ici.
         */

        setStorageItemMock.mockClear();
        getStorageItemMock.mockClear();

        const bank_inventory: HTMLDivElement = document.createElement('div');
        bank_inventory.id = 'bank-inventory';
        bank_inventory.dataset.inventoryAId = RUCKSACK_ID;
        bank_inventory.dataset.inventoryBId = BANK_ID;

        /** Bouton d'ancrage requis par la mise en page étroite (`window.innerWidth < 950`) */
        bank_inventory.appendChild(document.createElement('button'));

        rucksack = document.createElement('ul');
        rucksack.classList.add('rucksack');
        bank_inventory.appendChild(rucksack);

        document.body.appendChild(bank_inventory);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.unstubAllGlobals();
    });

    it('compte une prise en banque réussie une fois le rendu du sac à jour', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        /** Le signal part avant la mutation DOM côté jeu (`emitSignal` précède `setInventoryA`) : le MutationObserver posé par `scheduleCheck` doit être actif AVANT que le sac ne change */
        dispatchBankTakeSignal();
        rucksack.appendChild(rucksackItem(normal_item));
        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(normal_item.id);
    });

    it('ne compte pas un objet essentiel (icône verrou) déjà présent quand une vraie prise a lieu', async () => {
        rucksack.appendChild(rucksackItem(guardian_shield, { locked: true }));
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        dispatchBankTakeSignal();
        rucksack.appendChild(rucksackItem(normal_item));
        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(normal_item.id);
    });

    it('compte 1 prise « incertaine » (icône d\'avertissement) quand deux objets NON essentiels apparaissent d\'un coup', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        /** Le sac était en réalité déjà chargé avec `second_item`, mais React n'avait pas fini son rendu à l'initialisation du suivi */
        dispatchBankTakeSignal();
        rucksack.appendChild(rucksackItem(second_item));
        rucksack.appendChild(rucksackItem(normal_item));
        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.img).toBe('icons/small_warning.gif');
        expect(stored_values[0].item.item.id).not.toBe(normal_item.id);
        expect(stored_values[0].item.item.id).not.toBe(second_item.id);
    });

    it('ignore un transfert qui ne va pas de la banque vers le sac (direction descendante)', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        rucksack.appendChild(rucksackItem(normal_item));
        dispatchBankTakeSignal({ direction: 'down', from: Number(RUCKSACK_ID), to: Number(BANK_ID) });
        await flushAnimationFrame();

        expect(setStorageItemMock).not.toHaveBeenCalled();
    });

    it('ignore un transfert entre deux inventaires qui ne sont pas ceux de cette banque', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        rucksack.appendChild(rucksackItem(normal_item));
        dispatchBankTakeSignal({ from: 999 });
        await flushAnimationFrame();

        expect(setStorageItemMock).not.toHaveBeenCalled();
    });

    it('ne compte rien quand le signal se déclenche sans que le sac n\'ait changé (transfert refusé côté serveur)', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        dispatchBankTakeSignal();
        await flushAnimationFrame();

        expect(setStorageItemMock).not.toHaveBeenCalled();
    });

    it('compte les 2 prises quand deux clics très rapprochés envoient 2 signaux avant le premier requestAnimationFrame', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        /** Les deux transferts aboutissent avant que le premier rAF planifié n'ait pu s'exécuter */
        dispatchBankTakeSignal();
        dispatchBankTakeSignal();
        rucksack.appendChild(rucksackItem(normal_item));
        rucksack.appendChild(rucksackItem(second_item));

        /** Le MutationObserver (microtâche) programme lui-même une frame via `readSettledBagItems` : il faut une frame de plus que la mutation elle-même */
        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const ids: number[] = (last_call![1] as StoredCounterValue[]).map((v: StoredCounterValue) => v.item.item.id).sort();
        expect(ids).toEqual([normal_item.id, second_item.id].sort());
    });

    it('compte 1 prise « incertaine » si 2 signaux rapprochés ne font apparaître que 3 objets nouveaux (plus que de transferts confirmés)', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        const third_item: MhoItem = { id: 4, img: 'item/third.png', label: { fr: 'Troisième objet', en: '', de: '', es: '' } } as MhoItem;
        state.items = [...(state.items ?? []), third_item];

        dispatchBankTakeSignal();
        dispatchBankTakeSignal();
        rucksack.appendChild(rucksackItem(normal_item));
        rucksack.appendChild(rucksackItem(second_item));
        rucksack.appendChild(rucksackItem(third_item));

        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(2);
        stored_values.forEach((value: StoredCounterValue) => expect(value.item.item.img).toBe('icons/small_warning.gif'));
    });

    it('compte les 4 prises d\'un même objet (4 signaux, sac vide → 4 <li> séparés)', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        /** Les 4 transferts aboutissent avant que le premier rAF planifié n'ait pu s'exécuter */
        dispatchBankTakeSignal();
        dispatchBankTakeSignal();
        dispatchBankTakeSignal();
        dispatchBankTakeSignal();
        rucksack.appendChild(rucksackItem(normal_item));
        rucksack.appendChild(rucksackItem(normal_item));
        rucksack.appendChild(rucksackItem(normal_item));
        rucksack.appendChild(rucksackItem(normal_item));

        /** Le MutationObserver (microtâche) programme lui-même une frame via `readSettledBagItems` : il faut une frame de plus que la mutation elle-même */
        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(4);
        stored_values.forEach((value: StoredCounterValue) => expect(value.item.item.id).toBe(normal_item.id));
    });

    it('ne compte pas un objet déjà présent que le référentiel de l\'addon n\'avait pas encore résolu à l\'état de référence initial (chargement encore en cours) — repro exact rapporté en prod', async () => {
        /** Le référentiel (`state.items`) n'inclut pas encore `normal_item` au moment du relevé initial */
        state.items = [guardian_shield, second_item];
        rucksack.appendChild(rucksackItem(normal_item));

        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        /** Le référentiel finit de charger : `normal_item` devient résoluble, mais il était déjà là avant */
        state.items = [normal_item, guardian_shield, second_item];

        /** Un transfert refusé côté serveur (anti-abus déjà actif) déclenche quand même le signal, sans rien changer au sac */
        dispatchBankTakeSignal();
        await flushAnimationFrame();

        expect(setStorageItemMock).not.toHaveBeenCalled();
    });

    it('compte quand même la prise si TOUT le sac porte la classe .locked au moment du contrôle (verrou côté jeu pendant la requête de transfert, pas un état « objet essentiel ») — repro exact observé en prod', async () => {
        rucksack.appendChild(rucksackItem(guardian_shield, { locked: true }));
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        dispatchBankTakeSignal();

        /**
         * Le jeu pose `.locked` sur TOUT le sac tant qu'une requête est en vol
         * (`props.bag.locked = lock_a || loading || theftMode`), pas seulement sur les objets
         * essentiels — y compris juste après une prise réussie, le temps que l'état se stabilise.
         */
        rucksack.innerHTML = '';
        rucksack.appendChild(rucksackItem(guardian_shield, { locked: true }));
        rucksack.appendChild(rucksackItem(normal_item, { locked: true }));

        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(normal_item.id);
    });

    it('continue de compter les prises suivantes d\'un même objet (ex. la ferraille) — chaque exemplaire crée son propre <li> séparé, jamais de fusion en pastille — repro exact observé en prod', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        /** 1ère prise : le sac gagne un premier <li> pour cet objet, jamais vu avant */
        dispatchBankTakeSignal();
        rucksack.appendChild(rucksackItem(normal_item));
        await flushAnimationFrame();
        await flushAnimationFrame();

        let last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect((last_call![1] as StoredCounterValue[])).toHaveLength(1);

        /** 2e, 3e, 4e prises du MÊME objet : un <li> SÉPARÉ à chaque fois, jamais une pastille à badge grandissante */
        for (let i: number = 0; i < 3; i++) {
            setStorageItemMock.mockClear();
            dispatchBankTakeSignal();
            rucksack.appendChild(rucksackItem(normal_item));
            await flushAnimationFrame();
            await flushAnimationFrame();

            last_call = setStorageItemMock.mock.calls.at(-1);
            expect(last_call, `prise n°${i + 2}`).toBeDefined();
            const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
            expect(stored_values, `prise n°${i + 2}`).toHaveLength(1);
            expect(stored_values[0].item.item.id, `prise n°${i + 2}`).toBe(normal_item.id);
        }
    });

    it('compte la toute première prise correctement (pas « incertaine ») une fois que sig-inventory-bag-loaded confirme que le sac (déjà garni d\'autres objets) a fini de charger — repro exact du démarrage à froid observé en prod', async () => {
        /** Compteur créé avant que le sac n'ait fini son propre chargement asynchrone : rucksack encore vide */
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        /**
         * Le signal part dès que React appelle son `setState`, AVANT que le rendu ne soit
         * committé dans le vrai DOM (même course que pour une vraie prise) : le sac est donc
         * encore vide au moment exact du signal, et ne se peuple qu'ensuite.
         */
        dispatchRucksackLoadedSignal();
        rucksack.appendChild(rucksackItem(second_item));
        rucksack.appendChild(rucksackItem(guardian_shield, { locked: true }));
        /** La resynchro est différée d'une frame : elle doit lire le sac une fois peuplé, pas au moment du signal */
        await flushAnimationFrame();

        /** Première vraie prise : un seul objet nouveau doit être détecté, pas les objets déjà là */
        dispatchBankTakeSignal();
        rucksack.appendChild(rucksackItem(normal_item));
        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(normal_item.id);
    });

    it('ne resynchronise pas l\'état de référence sur sig-inventory-bag-loaded pendant qu\'une prise est en cours de traitement (fausserait le delta)', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        dispatchBankTakeSignal();
        /** Ce signal se déclenche aussi juste après un transfert, avant l'exécution du contrôle programmé */
        rucksack.appendChild(rucksackItem(normal_item));
        dispatchRucksackLoadedSignal();

        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(normal_item.id);
    });

    it('réessaie sur plusieurs frames tant que le sac contient des pastilles non résolues (vault pas encore répondu), jusqu\'à ce qu\'elles finissent par arriver — la liste d\'objets et leurs données d\'affichage (icône, nom) sont deux chargements séparés côté jeu, le second observé jusqu\'à plusieurs secondes plus lent en conditions réelles', async () => {
        /** Compteur créé sac encore vide : la resynchro initiale n'a rien à attendre pour l'instant (aucun <li>, pas de course à détecter) */
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();

        /** Le sac liste déjà 2 objets, mais leurs icônes (vault) n'ont pas encore répondu */
        rucksack.appendChild(pendingItemPlaceholder());
        rucksack.appendChild(pendingItemPlaceholder());

        /** Plusieurs frames de suite sans que rien ne se résolve : chaque réessai doit se reprogrammer tout seul */
        for (let i: number = 0; i < 5; i++) {
            await flushAnimationFrame();
        }
        expect(setStorageItemMock).not.toHaveBeenCalled();

        /** Le vault répond enfin, bien plus tard : les pastilles se résolvent en objets réels */
        rucksack.innerHTML = '';
        rucksack.appendChild(rucksackItem(second_item));
        rucksack.appendChild(rucksackItem(guardian_shield, { locked: true }));
        await flushAnimationFrame();

        /** Première vraie prise : un seul objet nouveau doit être détecté, pas les objets déjà là */
        dispatchBankTakeSignal();
        rucksack.appendChild(rucksackItem(normal_item));
        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(normal_item.id);
    });

    it('compte la prise même si l\'objet pris est LUI-MÊME encore une pastille non résolue au moment du contrôle (premier objet de ce type jamais affiché dans ce panneau sac — nouveau fetch vault déclenché par la prise elle-même) — repro exact rapporté en prod (1ère prise ignorée, 2e bonne)', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();
        await flushAnimationFrame();

        /** L'objet vient d'être transféré mais son vault (jamais vu dans ce panneau) n'a pas encore répondu */
        dispatchBankTakeSignal();
        rucksack.appendChild(pendingItemPlaceholder());

        /** Plusieurs frames sans résolution : le contrôle doit patienter, pas conclure à « rien de nouveau » */
        for (let i: number = 0; i < 5; i++) {
            await flushAnimationFrame();
        }
        expect(setStorageItemMock).not.toHaveBeenCalled();

        /** Le vault répond enfin : la pastille se résout en objet réel */
        rucksack.innerHTML = '';
        rucksack.appendChild(rucksackItem(normal_item));
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(normal_item.id);
    });

    it('abandonne après un silence prolongé sans activité vault (max_idle_ms dépassé), plutôt que d\'attendre indéfiniment', async () => {
        const now_spy: ReturnType<typeof vi.spyOn> = vi.spyOn(Date, 'now');
        let simulated_now: number = 1_000_000;
        now_spy.mockImplementation(() => simulated_now);

        let raf_calls: number = 0;
        vi.stubGlobal('requestAnimationFrame', (callback: () => void): ReturnType<typeof setTimeout> => {
            raf_calls++;
            return setTimeout(callback, 0);
        });

        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();
        await flushAnimationFrame();

        dispatchBankTakeSignal();
        /** L'objet pris reste une pastille non résolue pour toute la durée du test : aucune activité vault */
        rucksack.appendChild(pendingItemPlaceholder());
        await flushAnimationFrame();

        /** Silence de plus de 8s (max_idle_ms) sans le moindre `vaultUpdate` */
        simulated_now += 9000;
        await flushAnimationFrame();
        const raf_calls_after_giveup: number = raf_calls;

        /** Encore du temps et des frames : si la boucle avait vraiment abandonné, plus aucun réessai ne doit se programmer */
        simulated_now += 2000;
        await flushAnimationFrame();
        await flushAnimationFrame();

        expect(raf_calls).toBe(raf_calls_after_giveup);

        now_spy.mockRestore();
    });

    it('le MutationObserver capte une mutation qui arrive après le premier passage de readSettledBagItems — pas seulement une frame de retard, un vrai délai asynchrone entre le signal et le rendu (`emitSignal` précède `setInventoryA` côté jeu) — repro exact observé en prod (1ère prise ignorée sans le MutationObserver)', async () => {
        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();
        await flushAnimationFrame();

        dispatchBankTakeSignal();
        /** La mutation arrive sur un timer distinct, après le signal — pas synchrone comme dans les autres tests — pour reproduire le vrai délai entre `emitSignal` et le commit React */
        setTimeout(() => {
            rucksack.appendChild(rucksackItem(normal_item));
        }, 0);

        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(normal_item.id);
    });

    it('une notification d\'erreur (transfert refusé) fait aboutir le contrôle après un court répit, sans attendre le filet de secours (3s), sans rien enregistrer, et sans bloquer le contrôle suivant — `commonInventoryResponseHandler` déclenche toujours `$.html.message(...)` sur CHAQUE réponse (succès et refus), qui mute #notifications même quand le sac, lui, ne bouge pas', async () => {
        const notifications: HTMLDivElement = document.createElement('div');
        notifications.id = 'notifications';
        document.body.appendChild(notifications);

        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();
        await flushAnimationFrame();

        dispatchBankTakeSignal();
        /** Transfert refusé : le sac ne change jamais, mais une notification d'erreur apparaît (comme dans le vrai jeu) */
        const error_notice: HTMLDivElement = document.createElement('div');
        error_notice.classList.add('error');
        notifications.appendChild(error_notice);

        /** Répit (`notification_grace_frames`) avant d'accepter que le sac ne bougera pas, puis le relevé final : largement assez ici, aucune vraie attente de 3s */
        for (let i: number = 0; i < 10; i++) {
            await flushAnimationFrame();
        }

        /** Rien à enregistrer pour un refus confirmé */
        expect(setStorageItemMock).not.toHaveBeenCalled();

        /** Le contrôle suivant n'est pas resté bloqué (`check_scheduled` bien retombé à `false`) : une vraie prise ensuite reste comptée normalement */
        dispatchBankTakeSignal();
        rucksack.appendChild(rucksackItem(second_item));
        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(second_item.id);
    });

    it('une notification de succès qui arrive AVANT la mutation du sac ne fait pas conclure trop tôt — repro exacte du bug de prod (1ère prise silencieusement perdue) : `$.html.message(...)` mute #notifications de façon SYNCHRONE, avant que le commit React du sac (différé) n\'ait eu lieu', async () => {
        const notifications: HTMLDivElement = document.createElement('div');
        notifications.id = 'notifications';
        document.body.appendChild(notifications);

        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();
        await flushAnimationFrame();

        dispatchBankTakeSignal();
        /** `commonInventoryResponseHandler` ajoute cette notification de façon synchrone, AVANT que React n'ait committé le nouvel objet du sac */
        const success_notice: HTMLDivElement = document.createElement('div');
        success_notice.classList.add('notice');
        notifications.appendChild(success_notice);

        /** Quelques tours de répit s'écoulent, le sac ne bouge pas encore */
        await flushAnimationFrame();
        await flushAnimationFrame();

        /** Le commit React du sac arrive maintenant, avant la fin du répit */
        rucksack.appendChild(rucksackItem(normal_item));

        for (let i: number = 0; i < 10; i++) {
            await flushAnimationFrame();
        }

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(normal_item.id);
    });

    it('un dépôt (sac → banque) juste avant une prise d\'un AUTRE objet ne fait pas conclure trop tôt — le retrait déposé mute aussi `ul.rucksack`, mais n\'est pas une preuve de gain contrairement à la mutation d\'ajout de la prise qui suit', async () => {
        rucksack.appendChild(rucksackItem(normal_item));

        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();
        await flushAnimationFrame();

        /** Dépôt : ignoré par l'écouteur `sig-item-transfer` (direction 'down'), mais son retrait mutera quand même le sac plus tard */
        dispatchBankDepositSignal();
        /** Prise (d'un autre objet) juste après */
        dispatchBankTakeSignal();

        /** Le retrait déposé arrive en premier — mutation « imposteur » pour le contrôle de la prise */
        await flushAnimationFrame();
        await flushAnimationFrame();
        rucksack.removeChild(rucksack.querySelector('li')!);

        await flushAnimationFrame();
        await flushAnimationFrame();

        /** Le commit React de la prise arrive ensuite */
        rucksack.appendChild(rucksackItem(second_item));

        for (let i: number = 0; i < 10; i++) {
            await flushAnimationFrame();
        }

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(second_item.id);
    });

    it('un dépôt puis une reprise du MÊME objet reste comptée — `resyncBaseline` attend le retrait réel avant de figer la référence, pour ne pas garder l\'objet déposé dans le compte de départ (repro : dépose une ferraille, en reprend une, delta nul si la référence est restée périmée)', async () => {
        rucksack.appendChild(rucksackItem(normal_item));

        displayAntiAbuseCounter();
        await Promise.resolve();
        await Promise.resolve();
        await flushAnimationFrame();

        /** Dépôt confirmé : signal de transfert (ignoré) + signal de rechargement du sac (`setCache`, comme en jeu) — tous deux avant le retrait réel */
        dispatchBankDepositSignal();
        dispatchRucksackLoadedSignal();

        await flushAnimationFrame();
        rucksack.removeChild(rucksack.querySelector('li')!);

        for (let i: number = 0; i < 5; i++) {
            await flushAnimationFrame();
        }

        /** Reprend le MÊME objet */
        dispatchBankTakeSignal();
        rucksack.appendChild(rucksackItem(normal_item));
        await flushAnimationFrame();
        await flushAnimationFrame();

        const last_call: unknown[] | undefined = setStorageItemMock.mock.calls.at(-1);
        expect(last_call).toBeDefined();
        const stored_values: StoredCounterValue[] = last_call![1] as StoredCounterValue[];
        expect(stored_values).toHaveLength(1);
        expect(stored_values[0].item.item.id).toBe(normal_item.id);
    });
});
