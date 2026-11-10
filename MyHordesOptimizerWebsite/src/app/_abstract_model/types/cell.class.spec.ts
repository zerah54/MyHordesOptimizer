import { CellDTO, SaveCellDTO } from '../dto/cell.dto';
import { Cell, scoutLevelFromVisits, scoutVisitsRange } from './cell.class';

describe('Cell', (): void => {

    describe('toSaveCellDTO', (): void => {

        it('envoie nb_zombie (et non nb_hero, un champ distinct) dans nbZombie', (): void => {
            const cell: Cell = new Cell();
            cell.nb_zombie = 3;
            cell.nb_hero = 7;
            cell.nb_zombie_killed = 0;
            cell.is_dryed = false;
            cell.scav_zone_level = null;
            cell.scout_zone_level = null;
            cell.items = [];
            cell.citizens = [];
            cell.nb_ruin_dig = 0;
            cell.is_ruin_dryed = false;

            const dto: SaveCellDTO = cell.toSaveCellDTO();

            expect(dto.nbZombie).toBe(3);
        });

        it('envoie le nombre de passages d\'éclaireur', (): void => {
            const cell: Cell = new Cell();
            cell.items = [];
            cell.citizens = [];
            cell.scout_visits = 7;

            expect(cell.toSaveCellDTO().scoutVisits).toBe(7);
        });

    });

    describe('dtoToModel', (): void => {

        it('lit le nombre de passages d\'éclaireur, null s\'il est absent', (): void => {
            const with_visits: Cell = new Cell(<CellDTO><unknown>{ scoutVisits: 12, items: [], citizens: [] });
            const without_visits: Cell = new Cell(<CellDTO><unknown>{ items: [], citizens: [] });

            expect(with_visits.scout_visits).toBe(12);
            expect(without_visits.scout_visits).toBeNull();
        });

    });

    describe('scoutLevelFromVisits', (): void => {

        it('donne un niveau tous les 5 passages', (): void => {
            expect([0, 4, 5, 9, 10, 14, 15].map(scoutLevelFromVisits)).toEqual([0, 0, 1, 1, 2, 2, 3]);
        });

    });

    describe('scoutVisitsRange', (): void => {

        it('donne la plage de passages de chaque niveau, 15 pour le niveau 3', (): void => {
            expect([0, 1, 2, 3].map(scoutVisitsRange)).toEqual([{ min: 0, max: 4 }, { min: 5, max: 9 }, { min: 10, max: 14 }, { min: 15, max: 15 }]);
        });

    });

    describe('isScoutVisitsConsistent', (): void => {

        it('accepte un nombre ou un niveau inconnu, et un nombre dans la plage du niveau', (): void => {
            const cases: [number | null, number | null][] = [[null, 2], [7, null], [12, 2], [15, 3]];
            cases.forEach(([visits, level]: [number | null, number | null]): void => {
                expect(Object.assign(new Cell(), { scout_visits: visits, scout_zone_level: level }).isScoutVisitsConsistent()).toBe(true);
            });
        });

        it('refuse un nombre hors de la plage du niveau', (): void => {
            expect(Object.assign(new Cell(), { scout_visits: 7, scout_zone_level: 2 }).isScoutVisitsConsistent()).toBe(false);
            expect(Object.assign(new Cell(), { scout_visits: 14, scout_zone_level: 3 }).isScoutVisitsConsistent()).toBe(false);
        });

    });

});
