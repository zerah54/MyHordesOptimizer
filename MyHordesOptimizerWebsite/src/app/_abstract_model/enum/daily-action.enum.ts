import { CommonEnum, CommonEnumData } from './_common.enum';

const HOME_POOL_KEY: string = 'home_pool';
const HOME_SHOWER_KEY: string = 'home_shower';
const HOME_CLEAN_KEY: string = 'home_clean';

const HOME_POOL_DATA: DailyActionEnumData = { label: $localize`Bain`, img: 'building/small_pool.gif' };
const HOME_SHOWER_DATA: DailyActionEnumData = { label: $localize`Douche`, img: 'building/small_shower.gif' };
const HOME_CLEAN_DATA: DailyActionEnumData = { label: $localize`Ménage`, img: 'building/small_trashclean.gif' };

/** Actions quotidiennes câblées (lot 1 : bain migré, douche et ménage nouveaux). */
export class DailyActionEnum extends CommonEnum {
    public static HOME_POOL: DailyActionEnum = new DailyActionEnum(HOME_POOL_KEY, HOME_POOL_DATA);
    public static HOME_SHOWER: DailyActionEnum = new DailyActionEnum(HOME_SHOWER_KEY, HOME_SHOWER_DATA);
    public static HOME_CLEAN: DailyActionEnum = new DailyActionEnum(HOME_CLEAN_KEY, HOME_CLEAN_DATA);

    public constructor(public override key: string, public override value: DailyActionEnumData) {
        super(key, value);
    }

    public getLabel(): string {
        return this.value.label;
    }
}

interface DailyActionEnumData extends CommonEnumData {
    label: string;
    img: string;
}
