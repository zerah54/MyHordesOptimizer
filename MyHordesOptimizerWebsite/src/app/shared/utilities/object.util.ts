export function getValueFromPropertyName<T>(object: T, property_name: string): string | undefined {
    if (!object) return undefined;
    if (typeof object === 'string') return object;

    const values: string[] = property_name.split('.');
    let temp_value: Record<string, unknown> = object;
    values.forEach((value: string) => {
        temp_value = <Record<string, unknown>>temp_value[value];
    });
    return <string><unknown>temp_value;
}
