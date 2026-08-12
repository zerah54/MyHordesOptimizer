import { describe, expect, it, vi } from 'vitest';

import { btn_id, content_btn_id } from '../config/constants';
import { state } from '../state';
import { createOptimizerButtonContent } from './btn';

vi.mock('../utils/version', () => ({
    getScriptInfo: (): { name: string; version: string } => ({ name: 'MyHordes Optimizer', version: '1.0.0' }),
    isScriptVersionLastVersion: (): boolean => true,
    toggleNewChangelog: (): undefined => undefined
}));
/** Isole le test du rendu réel des paramètres (state.mho_parameters, catégories, etc.), hors sujet ici */
vi.mock('./params', () => ({
    createParams: (): undefined => undefined,
    createHelpButton: (): HTMLElement => document.createElement('a')
}));
vi.mock('../data/informations', () => ({
    informations: [
        { id: 'no-action-no-src', label: { fr: 'Sans action' }, src: undefined, action: undefined, img: undefined }
    ]
}));

function setupDom(): void {
    document.body.innerHTML = `<div id="${btn_id}"></div><div id="${content_btn_id}"></div>`;
}

/**
 * `HTMLElement.click()` ne propage pas de façon synchrone une exception levée dans un listener
 * (comportement DOM standard) : `expect(() => link.click()).not.toThrow()` ne détecterait donc
 * jamais le bug. jsdom capture l'exception et la reporte en redispatchant un évènement `error`
 * sur `window` de façon synchrone (voir `EventTarget-impl.js` / `runtime-script-errors.js`) :
 * on l'intercepte pour affirmer explicitement qu'aucune erreur n'a été levée.
 */
function captureWindowError(action: () => void): unknown {
    let captured_error: unknown;
    const on_error = (event: ErrorEvent): void => {
        captured_error = event.error;
        event.preventDefault();
    };
    window.addEventListener('error', on_error);
    try {
        action();
    } finally {
        window.removeEventListener('error', on_error);
    }
    return captured_error;
}

describe('createOptimizerButtonContent — entrées sans src ni action', () => {
    it('does not throw when an information entry has neither src nor action and is clicked', () => {
        setupDom();
        state.external_app_id = 'test-app-id';

        createOptimizerButtonContent();
        const link = document.getElementById('no-action-no-src') as HTMLAnchorElement;

        const captured_error = captureWindowError(() => link.click());

        expect(captured_error).toBeUndefined();
    });
});
