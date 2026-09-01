import { SaveCellDTO } from '../dto/cell.dto';
import { Cell } from './cell.class';

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

    });

});
