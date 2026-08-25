import { CdkTable } from '@angular/cdk/table';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';

import { TypedCellDefDirective } from './typed-cell-def.directive';

interface Row {
    label: string;
}

@Component({
    template: `
        <table #table [dataSource]="rows" mat-table>
            <ng-container matColumnDef="label">
                <td *matCellDef="let row; table: table" mat-cell>{{ row.label }}</td>
            </ng-container>
            <tr *matRowDef="let row; columns: ['label']" mat-row></tr>
        </table>
    `,
    imports: [MatTableModule, TypedCellDefDirective],
})
class HostComponent {
    public rows: Row[] = [{ label: 'a' }];
    @ViewChild(CdkTable) public table!: CdkTable<Row>;
}

describe('TypedCellDefDirective', () => {
    it('renders typed cells through a mat-table without runtime error', () => {
        const fixture: ComponentFixture<HostComponent> = TestBed.configureTestingModule({
            imports: [HostComponent],
        }).createComponent(HostComponent);

        fixture.detectChanges();

        const cell: HTMLElement = fixture.nativeElement.querySelector('td');
        expect(cell.textContent).toContain('a');
    });
});
