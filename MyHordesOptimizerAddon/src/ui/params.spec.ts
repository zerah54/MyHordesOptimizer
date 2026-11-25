import { describe, expect, it } from 'vitest';

import type { ParamDefinition } from '../types';
import { getParamState, refreshParentInputs } from './params';

const tree: ParamDefinition = {
    id: 'p',
    children: [
        { id: 'a' },
        { id: 'b', children: [{ id: 'b1' }, { id: 'b2' }] }
    ]
};

describe('getParamState', () => {
    it('returns checked when every descendant leaf is checked', () => {
        expect(getParamState(tree, { a: true, b1: true, b2: true })).toBe('checked');
    });

    it('returns unchecked when no descendant leaf is checked, whatever the parent stored value', () => {
        expect(getParamState(tree, { p: true, b: true, a: false })).toBe('unchecked');
    });

    it('returns indeterminate when a child is itself indeterminate', () => {
        expect(getParamState(tree, { a: true, b1: true, b2: false })).toBe('indeterminate');
    });

    it('returns indeterminate when children are mixed', () => {
        expect(getParamState(tree, { a: false, b1: true, b2: true })).toBe('indeterminate');
    });

    it('returns the stored value for a leaf', () => {
        expect(getParamState({ id: 'a' }, { a: true })).toBe('checked');
        expect(getParamState({ id: 'a' }, {})).toBe('unchecked');
    });
});

describe('getParamState — parent actif sans enfant', () => {
    const tool: ParamDefinition = { id: 't', active_without_children: true, children: [{ id: 't1' }, { id: 't2' }] };

    it('returns unchecked when the parent itself is unchecked', () => {
        expect(getParamState(tool, { t: false })).toBe('unchecked');
    });

    it('returns indeterminate when the parent is checked without any child', () => {
        expect(getParamState(tool, { t: true })).toBe('indeterminate');
    });

    it('returns checked when the parent and every child are checked', () => {
        expect(getParamState(tool, { t: true, t1: true, t2: true })).toBe('checked');
    });

    it('makes its own parent indeterminate rather than unchecked', () => {
        const top: ParamDefinition = { id: 'top', children: [tool, { id: 'other' }] };
        expect(getParamState(top, { t: true })).toBe('indeterminate');
    });
});

describe('refreshParentInputs', () => {
    it('keeps a parent active without children checked, and activates it when a child is checked', () => {
        document.body.innerHTML = '<input id="t_input" type="checkbox">';
        const tool: ParamDefinition = { id: 't', active_without_children: true, children: [{ id: 't1' }] };

        const kept: Record<string, boolean> = { t: true };
        refreshParentInputs([tool], kept);
        expect(kept.t).toBe(true);
        expect((document.getElementById('t_input') as HTMLInputElement).indeterminate).toBe(true);

        const activated: Record<string, boolean> = { t: false, t1: true };
        refreshParentInputs([tool], activated);
        expect(activated.t).toBe(true);
    });

    it('sets checked/indeterminate on parent inputs and stores a parent as active unless unchecked', () => {
        document.body.innerHTML = '<input id="p_input" type="checkbox"><input id="b_input" type="checkbox">';
        const values: Record<string, boolean> = { a: true, b1: true, b2: false };

        refreshParentInputs([tree], values);

        const p_input: HTMLInputElement = document.getElementById('p_input') as HTMLInputElement;
        const b_input: HTMLInputElement = document.getElementById('b_input') as HTMLInputElement;
        expect(p_input.indeterminate).toBe(true);
        expect(p_input.checked).toBe(false);
        expect(b_input.indeterminate).toBe(true);
        expect(values.p).toBe(true);
        expect(values.b).toBe(true);
    });

    it('stores a parent as inactive when no child is checked', () => {
        document.body.innerHTML = '<input id="p_input" type="checkbox" checked>';
        const values: Record<string, boolean> = { p: true, a: false };

        refreshParentInputs([tree], values);

        expect((document.getElementById('p_input') as HTMLInputElement).checked).toBe(false);
        expect(values.p).toBe(false);
    });
});
