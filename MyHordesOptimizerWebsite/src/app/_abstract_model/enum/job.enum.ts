import { CommonEnum, CommonEnumData } from './_common.enum';

const CITIZEN_KEY: string = 'basic';
const SCAVENGER_KEY: string = 'dig';
const SCOUT_KEY: string = 'vest';
const GUARDIAN_KEY: string = 'shield';
const SURVIVALIST_KEY: string = 'book';
const TAMER_KEY: string = 'tamer';
const TECHNICIAN_KEY: string = 'tech';

const CITIZEN_DATA: JobEnumData = { id: 'citizen', img: 'basic', label: $localize`Habitant`, camping_factor: 0.9 };
const SCAVENGER_DATA: JobEnumData = { id: 'scavenger', img: 'dig', label: $localize`Fouineur`, camping_factor: 0.9 };
const SCOUT_DATA: JobEnumData = { id: 'scout', img: 'vest', label: $localize`Éclaireur`, camping_factor: 0.9 };
const GUARDIAN_DATA: JobEnumData = { id: 'guardian', img: 'shield', label: $localize`Gardien`, camping_factor: 0.9 };
const SURVIVALIST_DATA: JobEnumData = { id: 'survivalist', img: 'book', label: $localize`Ermite`, camping_factor: 1 };
const TAMER_DATA: JobEnumData = { id: 'tamer', img: 'tamer', label: $localize`Apprivoiseur`, camping_factor: 0.9 };
const TECHNICIAN_DATA: JobEnumData = { id: 'technician', img: 'tech', label: $localize`Technicien`, camping_factor: 0.9 };

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
     * @param {StatusEnumData} value
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
}
