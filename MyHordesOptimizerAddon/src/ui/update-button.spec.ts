import { afterEach, beforeEach, describe, expect, it, type Mock, type MockInstance, vi } from 'vitest';

import { type ExternalToolsUpdateJobState, updateExternalTools } from '../api/update';
import { mh_update_external_tools_id, mho_warn_missing_logs_id } from '../config/constants';
import { state } from '../state';
import { createSmallUpdateExternalToolsButton, createUpdateExternalToolsButton } from './update-button';

vi.mock('../utils/version', () => ({ getScriptInfo: (): { name: string; version: string } => ({ name: 'MHO Addon', version: '0.0.0' }), convertResponsePromiseToError: vi.fn() }));
vi.mock('./params', () => ({ createHelpButton: vi.fn((): HTMLElement => document.createElement('span')) }));
vi.mock('../api/update', () => ({ updateExternalTools: vi.fn() }));
vi.mock('../utils/storage', () => ({ getStorageItem: vi.fn().mockResolvedValue(undefined), setStorageItem: vi.fn().mockResolvedValue(undefined) }));

function createButton(): HTMLElement | null {
    createUpdateExternalToolsButton();
    return document.getElementById(mh_update_external_tools_id);
}

describe('createUpdateExternalToolsButton — Zen Hordes', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div><div><div><div id="zone-marker"></div></div></div></div>';
        state.external_app_id = 'user-key';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('crée le bouton quand Zen Hordes est le seul outil coché', () => {
        state.mho_parameters = { update_zen: true };

        expect(createButton()).not.toBeNull();
    });

    it('ne crée pas le bouton quand aucun outil n\'est coché', () => {
        state.mho_parameters = {};

        expect(createButton()).toBeNull();
    });
});

describe('createUpdateExternalToolsButton — avertissement de registre incomplet', () => {
    const flushMutations = (): Promise<void> => new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve);
    });

    beforeEach(() => {
        document.body.innerHTML = '<div><div><div><div id="zone-marker"></div></div></div></div>'
            + '<hordes-log id="beyond-log"><div class="log-content"></div></hordes-log>';
        state.external_app_id = 'user-key';
        state.mho_parameters = { update_mho: true, update_mho_digs: true };
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    const addCompleteLink = (): void => {
        const link: HTMLElement = document.createElement('div');
        link.classList.add('log-complete-link');
        document.querySelector('#beyond-log .log-content')?.appendChild(link);
    };

    it('retire l\'avertissement quand le registre finit de charger sans lien « Afficher toutes les entrées »', async () => {
        addCompleteLink();
        createUpdateExternalToolsButton();
        expect(document.getElementById(mho_warn_missing_logs_id)).not.toBeNull();

        document.querySelector('.log-complete-link')?.remove();
        await flushMutations();

        expect(document.getElementById(mho_warn_missing_logs_id)).toBeNull();
    });

    it('n\'affiche pas l\'avertissement quand toutes les lignes du jour sont affichées', () => {
        addCompleteLink();
        const headers: string = '<div class="log-day-header">Jour 5 (aujourd\'hui)</div><div class="log-day-header">Jour 4</div>';
        document.querySelector('#beyond-log .log-content')?.insertAdjacentHTML('afterbegin', headers);
        createUpdateExternalToolsButton();

        expect(document.getElementById(mho_warn_missing_logs_id)).toBeNull();
    });

    it('affiche l\'avertissement tant que le registre n\'est pas monté', () => {
        (document.querySelector('#beyond-log') as Element).innerHTML = '';
        createUpdateExternalToolsButton();

        expect(document.getElementById(mho_warn_missing_logs_id)).not.toBeNull();
    });

    it('affiche l\'avertissement quand le lien apparaît après le bouton', async () => {
        createUpdateExternalToolsButton();
        expect(document.getElementById(mho_warn_missing_logs_id)).toBeNull();

        addCompleteLink();
        await flushMutations();

        expect(document.getElementById(mho_warn_missing_logs_id)).not.toBeNull();
    });
});

describe('createSmallUpdateExternalToolsButton', () => {
    /** Laisse passer les promesses en attente */
    const flushPromises = (): Promise<void> => new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve);
    });
    const final_state: ExternalToolsUpdateJobState = { jobId: 'job', isRunning: false, tools: [] };

    beforeEach(() => {
        document.body.innerHTML = '<div id="tooltip_container"></div>';
        vi.mocked(updateExternalTools).mockReset();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('sans options, comportement et id inchangés', () => {
        const button: HTMLElement = createSmallUpdateExternalToolsButton(null);

        expect(button.id).toBe(mh_update_external_tools_id);
        expect(document.querySelector('#tooltip_container #external-tools-btn-tooltip')).not.toBeNull();
    });

    it('avec id null, aucun id posé et l\'infobulle par défaut n\'est pas touchée', () => {
        document.body.innerHTML = '<div id="tooltip_container"><div id="external-tools-btn-tooltip">désert</div></div>';

        const button: HTMLElement = createSmallUpdateExternalToolsButton(null, { id: null, tooltip_id: 'mho-program-update-tooltip' });

        expect(button.hasAttribute('id')).toBe(false);
        expect(document.getElementById('external-tools-btn-tooltip')?.innerHTML).toBe('désert');
        expect(document.querySelector('#tooltip_container #mho-program-update-tooltip')).not.toBeNull();
    });

    it('on_done appelé après la fin de la mise à jour', async () => {
        let finish: (job_state: ExternalToolsUpdateJobState) => void = (): void => undefined;
        vi.mocked(updateExternalTools).mockReturnValue(new Promise<ExternalToolsUpdateJobState>((resolve: (job_state: ExternalToolsUpdateJobState) => void): void => {
            finish = resolve;
        }));
        const on_done: Mock = vi.fn();
        const button: HTMLElement = createSmallUpdateExternalToolsButton(null, { id: null, tooltip_id: 'mho-program-update-tooltip', on_done });

        button.click();
        await flushPromises();
        expect(on_done).not.toHaveBeenCalled();

        finish({ ...final_state, tools: [{ tool: 'gestHordes', status: 'error', errors: [] }] });
        await flushPromises();
        expect(on_done).toHaveBeenCalledTimes(1);
    });

    it('on_done n\'est pas appelé quand la mise à jour échoue', async () => {
        vi.mocked(updateExternalTools).mockRejectedValue(new Error('réseau'));
        const on_done: Mock = vi.fn();
        const error_spy: MockInstance = vi.spyOn(console, 'error').mockImplementation((): void => undefined);
        const button: HTMLElement = createSmallUpdateExternalToolsButton(null, { on_done });

        button.click();
        await flushPromises();

        expect(on_done).not.toHaveBeenCalled();
        error_spy.mockRestore();
    });
});
