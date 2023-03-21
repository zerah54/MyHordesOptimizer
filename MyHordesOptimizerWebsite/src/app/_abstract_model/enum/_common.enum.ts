import { environment } from 'src/environments/environment';

export abstract class CommonEnum {

    /**
     * Retourne l'objet correspondant à la clé fournie
     *
     * @param {string} key la clé
     *
     * @return {T} l'object correspondant.
     */
    public static getValue<T extends CommonEnum>(key: string): T | undefined {
        if (key === null || key === undefined) return undefined;

        const property_descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(this, key);
        if (property_descriptor) {
            return property_descriptor.value.valueOf();
        } else {
            if (!environment.production) {
                console.error(`Aucune valeur pour "${this.name}" correspondant à la clé "${key}"`);
            }
            return undefined;
        }
    }

    /**
     * Retourne les objets correspondant aux clés fournies
     *
     * @param {string[]} keys les clés
     *
     * @return {T[]} les objets correspondant.
     */
    public static getValues<T extends CommonEnum>(keys: string[]): T[] {
        return keys ? <T[]>keys.filter((value: string) => this.getValue(value)).map((value: string) => this.getValue(value)) : [];
    }

    /**
     * Retourne l'objet correspondant à la clé fournie
     *
     * @param {string} key la clé
     *
     * @return {T} l'object correspondant.
     */
    public static getByKey<T extends CommonEnum>(key: string): T | undefined {
        const elements: T[] = <T[]>this.getAllValues<CommonEnum>();
        const element: T | undefined = elements.find((_element: T) => _element.key === key);
        if (!element) {
            if (key !== null) {// TODO TEMPORAIRE
                // console.error(`Aucune valeur pour "${this.name}" correspondant à la clé "${key}"`);
            }
            return;
        } else {
            return element;
        }
    }


    /**
     * Vérifie l'égalité entre deux enum custom
     *
     * @param {T} a
     * @param {T} b
     *
     * @return {boolean}
     */
    public static equals<T extends CommonEnum>(a: T, b: T): boolean {
        if (!a && !b) {
            return true;
        } else if (!a || !b) {
            return false;
        }
        return a.key === b.key;
    }

    /** @return {T[]} retourne la liste des valeurs possibles */
    public static getAllValues<T extends CommonEnum>(): T[] {
        return this.getValues<T>(Object.keys(this)).filter((value: T | undefined) => value instanceof this);
    }


    /** @return {string} la liste des clés possibles */
    public static getAllKeys<T extends CommonEnum>(): (string | undefined)[] {
        return this.getAllValues<T>().map((value: T | undefined) => value ? value.key : undefined);
    }

    /** Le constructeur de la classe parente aux Enum personnalisés */
    protected constructor(public key: string, public value: CommonEnumData) {
    }

    /** @return {string} Retourne la clé */
    public toString(): string {
        return this.key;
    }

    /** @return {T[]} Retourne la valeur */
    public toValue<T extends CommonEnumData>(): T {
        return <T>this.value;
    }

    /**
     * Vérifie si l'enum correspond à l'une des clés passées en paramètre
     *
     * @param {string} keys les clés à tester
     *
     * @return {boolean} true si l'enum match avec l'une des clés
     */
    public contains(...keys: string[]): boolean {
        return keys.some((key: string) => key === this.key);
    }

    /** @return {string} Le libellé principal */
    public abstract getLabel(): string;

}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CommonEnumData {
}
