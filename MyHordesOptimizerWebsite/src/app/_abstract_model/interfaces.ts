export interface MinMax {
    min: number | undefined;
    max: number | undefined;
}

export interface Entry {
    hour: string;
    entry: string;
}

export interface StandardColumn {
    header: string;
    id: string;
    class?: string;
    sticky?: boolean;
    displayed?: () => boolean;
}

export interface Theme {
    label: string;
    class: string;
}
