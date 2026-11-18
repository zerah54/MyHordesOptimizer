import { flushPendingHeroSkills, queueHeroSkills, saveHeroSkills } from '../api/hero-skills';
import { mh_optimizer_icon, mho_hero_skills_update_id } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import type { HeroSkillLevels } from '../utils/hero-skills';
import { readActiveHeroSkills, readOnboardingHeroSkills } from '../utils/hero-skills';
import { getI18N } from '../utils/i18n';
import { addError } from '../utils/notifications';

/** Le récapitulatif est une modale montée au clic sur « valider », bien après la navigation : on l'observe. */
let onboarding_observer: MutationObserver | undefined;

/**
 * Mise à jour des S.U.P.E.R. dans MHO depuis l'onglet « Capacités actives » de `soul/heroskill`
 * et depuis le récapitulatif de l'entrée en ville. Envoie aussi ceux relevés avant l'entrée en ville.
 */
export function createHeroSkillsUpdateButtons(): void {
    onboarding_observer?.disconnect();
    onboarding_observer = undefined;
    const parameters: Record<string, boolean | undefined> = state.mho_parameters ?? {};
    if (!parameters.update_mho || !parameters.update_mho_hero_skills) return;

    flushPendingHeroSkills().catch((): void => undefined);

    const active_tab: Element | null = document.querySelector('[x-tab-group="skill-page"][x-tab-id="current"][x-tab-target]');
    if (active_tab) {
        addButton(active_tab, true, sendActiveHeroSkills);
    }

    const onboarding: Element | null = document.querySelector('hordes-town-onboarding[data-town]');
    if (onboarding) {
        const town_id: number = +onboarding.getAttribute('data-town');
        const inject = (): void => {
            const dialog: HTMLDialogElement | null = onboarding.querySelector('dialog');
            const skills_row: Element | null | undefined = dialog?.querySelector('span + span > b')?.closest('.row');
            if (dialog && skills_row) {
                addButton(skills_row.querySelector('.cell') ?? skills_row, false, (): Promise<string> => sendOnboardingHeroSkills(dialog, town_id));
            }
        };
        onboarding_observer = new MutationObserver(inject);
        onboarding_observer.observe(onboarding, { childList: true, subtree: true });
        inject();
    }
}

/**
 * Pose le bouton une seule fois dans `container`.
 * @param send Renvoie la ligne de résultat ; rejette sur un échec.
 */
function addButton(container: Element, at_top: boolean, send: () => Promise<string>): void {
    if (container.querySelector(`#${mho_hero_skills_update_id}`)) return;

    const block: HTMLElement = document.createElement('div');
    block.style.margin = '0.5em 0';
    block.style.padding = '0.25em';
    block.style.border = '1px solid #ddab76';

    const button: HTMLButtonElement = document.createElement('button');
    // Dans le récapitulatif, un bouton sans type validerait l'entrée en ville (form method="dialog")
    button.type = 'button';
    button.id = mho_hero_skills_update_id;
    button.innerHTML = `<img src="${mh_optimizer_icon}" height="16" width="16"> ${getI18N(texts.hero_skills_update_btn)}`;
    block.appendChild(button);

    const result: HTMLElement = document.createElement('div');
    block.appendChild(result);

    button.addEventListener('click', (): void => {
        button.disabled = true;
        result.innerText = getI18N(texts.update_external_tools_pending_btn_label) ?? '';
        send()
            .then((line: string): void => {
                result.innerText = line;
            }, (error: unknown): void => {
                result.innerText = `✖ ${getI18N(texts.update_external_tools_fail_btn_label)}`;
                addError(error);
            })
            .finally((): void => {
                button.disabled = false;
            });
    });

    if (at_top) {
        container.insertBefore(block, container.firstChild);
    } else {
        container.appendChild(block);
    }
}

function readOrFail<T>(value: T | undefined): T {
    if (value === undefined) throw new Error('Capacités S.U.P.E.R. illisibles');
    return value;
}

async function sendActiveHeroSkills(): Promise<string> {
    const levels: HeroSkillLevels = readOrFail(readActiveHeroSkills(document));
    const town_id: number = readOrFail(state.mh_user?.townDetails?.townId ?? undefined);
    await saveHeroSkills(town_id, levels);
    return `✔ ${formatLevels(levels)}`;
}

async function sendOnboardingHeroSkills(dialog: ParentNode, town_id: number): Promise<string> {
    const levels: HeroSkillLevels = readOrFail(readOnboardingHeroSkills(dialog));
    const sent: boolean = await queueHeroSkills(town_id, levels);
    return sent ? `✔ ${formatLevels(levels)}` : `⏳ ${formatLevels(levels)} — ${getI18N(texts.hero_skills_update_deferred)}`;
}

function formatLevels(levels: HeroSkillLevels): string {
    return Object.entries(levels).map(([group, level]: [string, number]): string => `${group}${level}`).join(' ');
}
