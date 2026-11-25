import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { fillItemsMessages } from './forum';

vi.mock('../utils/page', () => ({
    pageIsMsgReceived: (): boolean => true,
    pageIsDesert: (): boolean => false,
    pageIsForum: (): boolean => false
}));

interface MessagePage {
    items: HTMLLIElement[];
    input: HTMLInputElement;
}

/** Reproduit la zone d'envoi de messages avec un éditeur et deux objets envoyables */
function buildMessagePage(): MessagePage {
    document.body.innerHTML = `
        <div id="rows-send"><ul class="sendable-items"><li class="item"></li><li class="item"></li></ul></div>
        <div id="pm-forum-editor"><hordes-twino-editor><input><textarea></textarea></hordes-twino-editor></div>`;
    return {
        items: Array.from(document.querySelectorAll('li.item')) as HTMLLIElement[],
        input: document.querySelector('input') as HTMLInputElement
    };
}

describe('fillItemsMessages : rejeux', () => {
    beforeEach((): void => {
        vi.useFakeTimers();
        state.mho_parameters = { fill_items_messages: true };
    });

    afterEach((): void => {
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    it('ne remplit qu\'une fois après plusieurs rejeux puis un clic', () => {
        const page: MessagePage = buildMessagePage();
        const add_spy = vi.spyOn(page.items[0], 'addEventListener');

        fillItemsMessages();
        fillItemsMessages();
        fillItemsMessages();
        vi.advanceTimersByTime(1000);
        fillItemsMessages();
        vi.advanceTimersByTime(1000);

        const bound: number = add_spy.mock.calls.filter((call: unknown[]): boolean => call[0] === 'click').length;
        expect(bound).toBe(1);
    });

    it('remplit l\'éditeur présent au clic même s\'il a été remplacé après l\'abonnement', () => {
        const page: MessagePage = buildMessagePage();
        fillItemsMessages();
        vi.advanceTimersByTime(1000);

        const holder: Element = document.querySelector('#pm-forum-editor') as Element;
        holder.innerHTML = '<hordes-twino-editor><input><textarea></textarea></hordes-twino-editor>';
        const new_input: HTMLInputElement = holder.querySelector('input') as HTMLInputElement;
        page.items[0].dispatchEvent(new Event('click'));

        expect(new_input.getAttribute('value')).not.toBeNull();
    });

    it('ne programme qu\'un seul délai en attente', () => {
        buildMessagePage();
        fillItemsMessages();
        fillItemsMessages();
        fillItemsMessages();

        expect(vi.getTimerCount()).toBe(1);
    });

    it('équipe un objet apparu après un premier passage', () => {
        const page: MessagePage = buildMessagePage();
        fillItemsMessages();
        vi.advanceTimersByTime(1000);
        const late: HTMLLIElement = document.createElement('li');
        late.className = 'item';
        document.querySelector('.sendable-items')!.appendChild(late);

        fillItemsMessages();
        vi.advanceTimersByTime(1000);
        const inputs: { count: number } = { count: 0 };
        page.input.addEventListener('input', (): void => { inputs.count++; });
        late.click();

        expect(inputs.count).toBe(1);
    });
});
