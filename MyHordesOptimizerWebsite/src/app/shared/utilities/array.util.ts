export function groupBy<T>(list: T[], key_getter: (item: T) => number | string): T[][] {
    const map: Map<string | number, T[]> = new Map();
    list.forEach((item: T) => {
        const key = key_getter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });

    let map_flat: T[][] = [];
    map.forEach((map_item) => {
        map_flat.push(map_item);
    })

    return map_flat;
}
