import { TownContextService } from '../../_core/services/town-context.service';
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

    it('propose « Mon programme » juste après « Chantiers »', (): void => {
        const suffixes: (string | undefined)[] = townChildren().map((link: SidenavLinks): string | undefined => link.townSuffix);

        expect(suffixes).toContain('program');
        expect(suffixes.indexOf('program')).toBe(suffixes.indexOf('buildings') + 1);
    });

    it('cache « Mon programme » quand le service le dit', (): void => {
        const entry: SidenavLinks | undefined = townChildren(false).find((link: SidenavLinks): boolean => link.townSuffix === 'program');

        expect(entry?.authorized()).toBe(false);
    });
});
