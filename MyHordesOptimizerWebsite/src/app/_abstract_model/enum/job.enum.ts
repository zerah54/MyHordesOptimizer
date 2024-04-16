import { CommonEnum, CommonEnumData } from './_common.enum';

const CITIZEN_KEY: string = 'basic';
const SCAVENGER_KEY: string = 'dig';
const SCOUT_KEY: string = 'vest';
const GUARDIAN_KEY: string = 'shield';
const SURVIVALIST_KEY: string = 'book';
const TAMER_KEY: string = 'tamer';
const TECHNICIAN_KEY: string = 'tech';

const CITIZEN_DATA: JobEnumData = {id: 'citizen', img: 'professions/basic.gif', label: $localize`Habitant`, forum_icon: 'basic', camping_factor: 0.9};
const SCAVENGER_DATA: JobEnumData = {id: 'scavenger', img: 'professions/dig.gif', label: $localize`Fouineur`, forum_icon: 'scav', camping_factor: 0.9};
const SCOUT_DATA: JobEnumData = {id: 'scout', img: 'professions/vest.gif', label: $localize`Éclaireur`, forum_icon: 'scout', camping_factor: 0.9};
const GUARDIAN_DATA: JobEnumData = {id: 'guardian', img: 'professions/shield.gif', label: $localize`Gardien`, forum_icon: 'guard', camping_factor: 0.9};
const SURVIVALIST_DATA: JobEnumData = {id: 'survivalist', img: 'professions/book.gif', label: $localize`Ermite`, forum_icon: 'surv', camping_factor: 1};
const TAMER_DATA: JobEnumData = {id: 'tamer', img: 'professions/tamer.gif', label: $localize`Apprivoiseur`, forum_icon: 'tamer', camping_factor: 0.9};
const TECHNICIAN_DATA: JobEnumData = {id: 'technician', img: 'professions/tech.gif', label: $localize`Technicien`, forum_icon: 'tech', camping_factor: 0.9};

/** Type de champs de propriétés existants */
export class JobEnum extends CommonEnum {
    static CITIZEN: JobEnum = new JobEnum(CITIZEN_KEY, CITIZEN_DATA);
    static SCAVENGER: JobEnum = new JobEnum(SCAVENGER_KEY, SCAVENGER_DATA);
    static SCOUT: JobEnum = new JobEnum(SCOUT_KEY, SCOUT_DATA);
    static GUARDIAN: JobEnum = new JobEnum(GUARDIAN_KEY, GUARDIAN_DATA);
    static SURVIVALIST: JobEnum = new JobEnum(SURVIVALIST_KEY, SURVIVALIST_DATA);
    static TAMER: JobEnum = new JobEnum(TAMER_KEY, TAMER_DATA);
    static TECHNICIAN: JobEnum = new JobEnum(TECHNICIAN_KEY, TECHNICIAN_DATA);

    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key
     * @param {JobEnumData} value
     */
    protected constructor(public override key: string, public override value: JobEnumData) {
        super(key, value);
    }

    public getLabel(): string {
        return this.value.label;
    }

}

interface JobEnumData extends CommonEnumData {
    id: string;
    img: string;
    label: string;
    camping_factor: number;
    forum_icon: string;
}
