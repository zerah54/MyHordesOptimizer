import { statusLabel, StatusOption, statusOptions } from './nightwatch-status-labels';

describe('nightwatch-status-labels', (): void => {
    const scope: { $localize: typeof $localize } = globalThis as unknown as { $localize: typeof $localize };
    const original: typeof $localize = scope.$localize;

    afterEach((): void => {
        scope.$localize = original;
    });

    it('les libellés sont calculés à l\'appel (jamais au chargement du module)', (): void => {
        scope.$localize = ((strings: TemplateStringsArray): string => `T:${strings[0]}`) as typeof $localize;

        const labels: string[] = statusOptions().map((option: { label: string }): string => option.label);

        expect(labels).toContain('T:Chien');
        expect(labels).toContain('T:Chien avec steak');
        expect(labels).toContain('T:Goule');
        expect(statusLabel('ghoul')).toBe('T:Goule');
    });

    it('clé inconnue : la clé elle-même', (): void => {
        expect(statusLabel('inconnu')).toBe('inconnu');
    });

    it('statuts du jeu et clés du référentiel de veille', (): void => {
        expect(statusOptions().map((option: { key: string }): string => option.key)).toEqual(['drugged', 'drunk', 'thirsty', 'immune', 'dog', 'dogSteak', 'ghoul']);
    });

    it('chaque statut a une icône du jeu (chien : statuts de garde de l\'apprivoiseur)', (): void => {
        const icons: Record<string, string> = Object.fromEntries(statusOptions().map((option: StatusOption): [string, string] => [option.key, option.img]));

        expect(icons['dog']).toBe('status/status_tamer_watch_1.gif');
        expect(icons['dogSteak']).toBe('status/status_tamer_watch_2.gif');
        expect(icons['ghoul']).toBe('roles/ghoul.gif');
    });
});
