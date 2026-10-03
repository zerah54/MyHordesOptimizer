import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { alertIfInactiveAndNoEscort } from './desert';

interface DesertTestContext {
    create_notification: Mock;
    page: { is_desert: boolean };
}

const context: DesertTestContext = vi.hoisted((): DesertTestContext => ({
    create_notification: vi.fn(),
    page: { is_desert: true }
}));

vi.mock('../utils/notifications', (): { createNotification: Mock } => ({ createNotification: context.create_notification }));

vi.mock('../utils/page', (): { pageIsDesert: () => boolean } => ({ pageIsDesert: (): boolean => context.page.is_desert }));

const one_minute_ms: number = 60 * 1000;

/** Bouton « Attendre une escorte » : présent tant que l'attente d'escorte n'est pas activée */
function addEscortWaitingButton(): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement('button');
    button.setAttribute('x-toggle-escort', '1');
    document.body.appendChild(button);
    return button;
}

/** Marqueur d'une escorte en cours, non relâchée */
function addUnreleasedEscort(): void {
    const escort: HTMLDivElement = document.createElement('div');
    escort.classList.add('beyond-escort-on');
    document.body.appendChild(escort);
}

function moveMouse(): void {
    document.dispatchEvent(new MouseEvent('mousemove'));
}

function elapse(minutes: number): void {
    vi.advanceTimersByTime(minutes * one_minute_ms);
}

beforeEach((): void => {
    vi.useFakeTimers();
    context.create_notification.mockClear();
    context.page.is_desert = true;
    state.mho_parameters = { alert_if_no_escort: true, alert_if_inactive: true };
});

afterEach((): void => {
    /** Option décochée : remet à zéro le minuteur et la période d'inactivité du module */
    state.mho_parameters = {};
    alertIfInactiveAndNoEscort();
    document.body.innerHTML = '';
    vi.useRealTimers();
});

describe('alertIfInactiveAndNoEscort', () => {
    it('notifie après 5 minutes sans activité quand l\'attente d\'escorte n\'est pas activée', () => {
        addEscortWaitingButton();
        alertIfInactiveAndNoEscort();

        vi.advanceTimersByTime(5 * one_minute_ms - 1);
        expect(context.create_notification).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(context.create_notification).toHaveBeenCalledTimes(1);
        expect(context.create_notification).toHaveBeenCalledWith(getI18N(texts.prevent_not_in_ae));
    });

    it('relance le délai à chaque mouvement de souris', () => {
        addEscortWaitingButton();
        alertIfInactiveAndNoEscort();

        elapse(4);
        moveMouse();
        elapse(4);
        expect(context.create_notification).not.toHaveBeenCalled();

        elapse(1);
        expect(context.create_notification).toHaveBeenCalledTimes(1);
    });

    it('relance le délai à chaque clic ou frappe au clavier', () => {
        addEscortWaitingButton();
        alertIfInactiveAndNoEscort();

        elapse(3);
        document.dispatchEvent(new MouseEvent('click'));
        elapse(3);
        document.dispatchEvent(new KeyboardEvent('keydown'));
        elapse(4);
        expect(context.create_notification).not.toHaveBeenCalled();

        elapse(1);
        expect(context.create_notification).toHaveBeenCalledTimes(1);
    });

    it('évalue l\'état de l\'escorte au moment de notifier', () => {
        alertIfInactiveAndNoEscort();

        elapse(2);
        addUnreleasedEscort();
        elapse(3);

        expect(context.create_notification).toHaveBeenCalledTimes(1);
        expect(context.create_notification).toHaveBeenCalledWith(getI18N(texts.escort_not_released));
    });

    it('ne notifie pas si l\'escorte est en ordre à l\'échéance', () => {
        const button: HTMLButtonElement = addEscortWaitingButton();
        alertIfInactiveAndNoEscort();

        elapse(1);
        button.remove();
        elapse(10);

        expect(context.create_notification).not.toHaveBeenCalled();
    });

    it('un rejeu des initialisations n\'interrompt pas la période en cours et n\'empile rien', () => {
        addEscortWaitingButton();
        alertIfInactiveAndNoEscort();
        alertIfInactiveAndNoEscort();

        elapse(3);
        alertIfInactiveAndNoEscort();
        elapse(2);

        expect(context.create_notification).toHaveBeenCalledTimes(1);
    });

    it('ne notifie de nouveau qu\'après une nouvelle activité suivie de 5 minutes d\'inactivité', () => {
        addEscortWaitingButton();
        alertIfInactiveAndNoEscort();

        elapse(5);
        expect(context.create_notification).toHaveBeenCalledTimes(1);

        elapse(10);
        alertIfInactiveAndNoEscort();
        elapse(10);
        expect(context.create_notification).toHaveBeenCalledTimes(1);

        moveMouse();
        elapse(5);
        expect(context.create_notification).toHaveBeenCalledTimes(2);
    });

    it('ne fait rien si l\'option est décochée', () => {
        state.mho_parameters = { alert_if_no_escort: true, alert_if_inactive: false };
        addEscortWaitingButton();
        alertIfInactiveAndNoEscort();

        elapse(10);

        expect(context.create_notification).not.toHaveBeenCalled();
    });

    it('s\'arrête hors du désert', () => {
        addEscortWaitingButton();
        alertIfInactiveAndNoEscort();

        elapse(2);
        context.page.is_desert = false;
        alertIfInactiveAndNoEscort();
        elapse(10);

        expect(context.create_notification).not.toHaveBeenCalled();
    });
});
