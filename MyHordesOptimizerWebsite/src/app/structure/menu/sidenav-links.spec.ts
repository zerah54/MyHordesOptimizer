import { TownContextService } from '../../_core/services/town-context.service';
import { sitePage } from '../../_core/utilities/site-pages';
import { ProgramMenuService } from '../../my-town/program/program-menu.service';
import { buildSidenavLinks, SidenavLinks } from './sidenav-links';

describe('buildSidenavLinks', (): void => {
    function townChildren(program_visible: boolean = true): SidenavLinks[] {
        const links: SidenavLinks[] = buildSidenavLinks(
            { isReadonly: (): boolean => false } as unknown as TownContextService,
            { visible: (): boolean => program_visible } as unknown as ProgramMenuService
        );
        return links.find((link: SidenavLinks): boolean => link.isTownRoot === true)?.children ?? [];
    }

    it('propose « Mon programme » en dernier dans le menu de la ville', (): void => {
        const suffixes: (string | undefined)[] = townChildren().map((link: SidenavLinks): string | undefined => link.townSuffix);

        expect(suffixes.at(-1)).toBe('program');
    });

    it('prend libellé et icône des pages dans le registre du site', (): void => {
        const bank: SidenavLinks | undefined = townChildren().find((link: SidenavLinks): boolean => link.townSuffix === 'bank');

        expect(bank?.label).toBe(sitePage('townBank').label);
        expect(bank && 'icon' in bank).toBe(true);
        expect(bank?.icon).toBe(sitePage('townBank').icon);
    });

    it('cache « Mon programme » quand le service le dit', (): void => {
        const entry: SidenavLinks | undefined = townChildren(false).find((link: SidenavLinks): boolean => link.townSuffix === 'program');

        expect(entry?.authorized()).toBe(false);
    });
});
