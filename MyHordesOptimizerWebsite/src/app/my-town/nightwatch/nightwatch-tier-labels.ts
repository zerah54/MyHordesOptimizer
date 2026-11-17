import { SurvivalTier } from './nightwatch-model.util';

/**
 * Phrase de veille officielle d'un palier de survie.
 * @param {SurvivalTier} tier Palier.
 * @returns {string} Phrase affichée en jeu, traduite à l'appel.
 */
export function tierLabel(tier: SurvivalTier): string {
    switch (tier) {
        case 'certain':
            return $localize`Debout sur les remparts de la ville, vous êtes très confiant quant à l’issue de cette soirée. Vous ne mourrez pas aujourd'hui !`;
        case 't15':
            return $localize`Du haut des remparts, vous vous sentez invincible. Rien ne vous fera chanceler cette nuit.`;
        case 't30':
            return $localize`Du haut des remparts, vous vous sentez serein. Vous comptez bien être encore en vie demain.`;
        case 't45':
            return $localize`Du haut des remparts, vous vous sentez confiant. Vous attendez la hordes, que vous apercevez déjà.`;
        case 't60':
            return $localize`Du haut des remparts, vous observez l'horizon. Vous espérez voir le soleil se lever demain, encore une fois.`;
        case 't75':
            return $localize`Du haut des remparts, Vous vous sentez hésitant et le moral faible. Il n'y aura peut-être pas de lendemain pour vous...`;
        case 't90':
            return $localize`Du haut des remparts, vous êtes chancelant et vous le moral au plus bas, vous ne savez pas si vous verrez la lumière du jour...`;
        case 'dire':
            return $localize`Du haut des remparts, vous avez le cœur serré. Vous sentez que votre vie ne tient qu'à un fil...`;
    }
}
