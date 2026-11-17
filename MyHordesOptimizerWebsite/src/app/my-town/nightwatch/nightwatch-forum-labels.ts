import { ForumPostLabels } from './nightwatch-forum-post.util';
import { tierLabel } from './nightwatch-tier-labels';

/**
 * Textes et icônes du message forum, traduits à l'appel (jamais au chargement du module).
 * La phrase attendue est la phrase officielle du palier « certain ».
 * @returns {ForumPostLabels} Libellés du message.
 */
export function buildForumLabels(): ForumPostLabels {
    return {
        pa_emote: ':pa:',
        pile_emote: ':item_pile:',
        water_emote: ':item_water:',
        arrow_emote: ':arrowright:',
        sites_emote: ':sites:',
        defense_emote: ':def:',
        warning_emote: ':warning:',
        dog_emote: ':dog:',
        separator: '---',
        resources_used: $localize`Ressources utilisées`,
        repairable: $localize`Réparables`,
        rechargeable: $localize`Rechargeables`,
        programme_title: $localize`Programme de veille à`,
        repairs_suffix: $localize`de réparations`,
        batteries_suffix: $localize`piles sont consommées pour la veille`,
        base_suffix: $localize`de base`,
        mount_early: $localize`Montez tôt.`,
        drink_before_guitar: $localize`Buvez avant la guitare, +1 {pa}`,
        missing_phrase_intro: $localize`Si vous n'avez pas cette phrase :`,
        reassuring_quote: tierLabel('certain'),
        report_it: $localize`Merci de le signaler !`,
        dog_steak: $localize`Vérifiez la consigne du steak`,
        discourse_action: $localize`Discours rassurant multicolore`
    };
}
