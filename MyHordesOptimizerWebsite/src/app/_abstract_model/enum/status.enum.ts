import { CommonEnum, CommonEnumData } from "./_common.enum";

const ADDICT_KEY: string = 'addict';
const CAMPER_KEY: string = 'camper';
const CLEAN_KEY: string = 'clean';
const DRUGGED_KEY: string = 'drugged';
const DRUNK_KEY: string = 'drunk';
const HASDRUNK_KEY: string = 'hasdrunk';
const HASEATEN_KEY: string = 'haseaten';
const HEALED_KEY: string = 'healed';
const HSURVIVE_KEY: string = 'hsurvive';
const HUNGOVER_KEY: string = 'hungover';
const IMMUNE_KEY: string = 'immune';
const INFECTION_KEY: string = 'infection';
const TERROR_KEY: string = 'terror';
const THIRST1_KEY: string = 'thirst1';
const THIRST2_KEY: string = 'thirst2';
const TIRED_KEY: string = 'tired';
const WOUND1_KEY: string = 'wound1';
const WOUND2_KEY: string = 'wound2';
const WOUND3_KEY: string = 'wound3';
const WOUND4_KEY: string = 'wound4';
const WOUND5_KEY: string = 'wound5';
const WOUND6_KEY: string = 'wound6';

/** Type de champs de propriétés existants */
export class StatusEnum extends CommonEnum {
    static ADDICT: StatusEnum = new StatusEnum(ADDICT_KEY, {}, $localize``, 'status/status_' + ADDICT_KEY + '.gif', ADDICT_KEY);
    static CAMPER: StatusEnum = new StatusEnum(CAMPER_KEY, {}, $localize``, 'status/status_' + CAMPER_KEY + '.gif', CAMPER_KEY);
    static CLEAN: StatusEnum = new StatusEnum(CLEAN_KEY, {}, $localize``, 'status/status_' + CLEAN_KEY + '.gif', CLEAN_KEY);
    static DRUGGED: StatusEnum = new StatusEnum(DRUGGED_KEY, {}, $localize``, 'status/status_' + DRUGGED_KEY + '.gif', DRUGGED_KEY);
    static DRUNK: StatusEnum = new StatusEnum(DRUNK_KEY, {}, $localize``, 'status/status_' + DRUNK_KEY + '.gif', DRUNK_KEY);
    static HASDRUNK: StatusEnum = new StatusEnum(HASDRUNK_KEY, {}, $localize``, 'status/status_'  + HASDRUNK_KEY + '.gif', HASDRUNK_KEY);
    static HASEATEN: StatusEnum = new StatusEnum(HASEATEN_KEY, {}, $localize``, 'status/status_' + HASEATEN_KEY + '.gif', HASEATEN_KEY);
    static HEALED: StatusEnum = new StatusEnum(HEALED_KEY, {}, $localize``, 'status/status_' + HEALED_KEY + '.gif', HEALED_KEY);
    static HSURVIVE: StatusEnum = new StatusEnum(HSURVIVE_KEY, {}, $localize``, 'status/status_' + HSURVIVE_KEY + '.gif', HSURVIVE_KEY);
    static HUNGOVER: StatusEnum = new StatusEnum(HUNGOVER_KEY, {}, $localize``, 'status/status_' + HUNGOVER_KEY + '.gif', HUNGOVER_KEY);
    static IMMUNE: StatusEnum = new StatusEnum(IMMUNE_KEY, {}, $localize``, 'status/status_' + IMMUNE_KEY + '.gif', IMMUNE_KEY);
    static INFECTION: StatusEnum = new StatusEnum(INFECTION_KEY, {}, $localize``, 'status/status_' + INFECTION_KEY + '.gif', INFECTION_KEY);
    static TERROR: StatusEnum = new StatusEnum(TERROR_KEY, {}, $localize``, 'status/status_' + TERROR_KEY + '.gif', TERROR_KEY);
    static THIRST1: StatusEnum = new StatusEnum(THIRST1_KEY, {}, $localize``, 'status/status_' + THIRST1_KEY + '.gif', THIRST1_KEY);
    static THIRST2: StatusEnum = new StatusEnum(THIRST2_KEY, {}, $localize``, 'status/status_' + THIRST2_KEY + '.gif', THIRST2_KEY);
    static TIRED: StatusEnum = new StatusEnum(TIRED_KEY, {}, $localize``, 'status/status_' + TIRED_KEY + '.gif', TIRED_KEY);
    static WOUND1: StatusEnum = new StatusEnum(WOUND1_KEY, {}, $localize``, 'status/status_' + WOUND1_KEY + '.gif', WOUND1_KEY);
    static WOUND2: StatusEnum = new StatusEnum(WOUND2_KEY, {}, $localize``, 'status/status_' + WOUND2_KEY + '.gif', WOUND2_KEY);
    static WOUND3: StatusEnum = new StatusEnum(WOUND3_KEY, {}, $localize``, 'status/status_' + WOUND3_KEY + '.gif', WOUND3_KEY);
    static WOUND4: StatusEnum = new StatusEnum(WOUND4_KEY, {}, $localize``, 'status/status_' + WOUND4_KEY + '.gif', WOUND4_KEY);
    static WOUND5: StatusEnum = new StatusEnum(WOUND5_KEY, {}, $localize``, 'status/status_' + WOUND5_KEY + '.gif', WOUND5_KEY);
    static WOUND6: StatusEnum = new StatusEnum(WOUND6_KEY, {}, $localize``, 'status/status_' + WOUND6_KEY + '.gif', WOUND6_KEY);


    /**
     * Le constructeur privé empêche la création d'autres instances de cette classe.
     *
     * @param {string} key
     * @param {StatusEnumData} value
     */
    protected constructor(public override key: string, public override value: StatusEnumData, public label: string, public img: string, public id: string) {
        super(key, value);
    }

    public getLabel(): string {
        return this.label;
    }

}

interface StatusEnumData extends CommonEnumData {
}
