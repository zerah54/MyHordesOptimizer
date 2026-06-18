import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class MhoPaginatorIntl extends MatPaginatorIntl {
    public override itemsPerPageLabel: string = $localize`:@@paginator.itemsPerPage:Lignes par page`;
    public override nextPageLabel: string = $localize`:@@paginator.nextPage:Page suivante`;
    public override previousPageLabel: string = $localize`:@@paginator.previousPage:Page précédente`;
    public override firstPageLabel: string = $localize`:@@paginator.firstPage:Première page`;
    public override lastPageLabel: string = $localize`:@@paginator.lastPage:Dernière page`;

    public override getRangeLabel: (page: number, pageSize: number, length: number) => string = (page: number, pageSize: number, length: number): string => {
        if (length === 0) return $localize`:@@paginator.rangeEmpty:0 sur 0`;
        const start: number = page * pageSize + 1;
        const end: number = Math.min((page + 1) * pageSize, length);
        return $localize`:@@paginator.range:${start} – ${end} sur ${length}`;
    };
}
