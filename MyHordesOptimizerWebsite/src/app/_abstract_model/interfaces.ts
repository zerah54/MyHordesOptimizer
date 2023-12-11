import { MatTableDataSource } from '@angular/material/table';

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

export interface Misc {
    header: string;
    highlight_day: boolean;
    header_action?: MiscHeaderAction;
    columns: StandardColumn[];
    table: MatTableDataSource<{ [key: string]: number | string | null }>;
}

interface MiscHeaderAction {
    icon: string;
    action: () => void
}
