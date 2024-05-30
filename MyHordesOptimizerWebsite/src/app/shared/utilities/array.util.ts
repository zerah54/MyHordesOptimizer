export function groupBy<T>(list: T[], key_getter: (item: T, ...args: any[]) => number | string): T[][] {
    const map: Map<string | number, T[]> = new Map();
    list.forEach((item: T) => {
        const key: number | string = key_getter(item);
        const collection: T[] | undefined = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });

    const map_flat: T[][] = [];
    map.forEach((map_item: T[]) => {
        map_flat.push(map_item);
    });

    return map_flat;
}
