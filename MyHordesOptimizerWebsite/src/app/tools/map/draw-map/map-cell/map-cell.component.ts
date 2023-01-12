import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'mho-map-cell',
  templateUrl: './map-cell.component.html',
  styleUrls: ['./map-cell.component.scss', '../draw-map.component.scss']
})
export class MapCellComponent {
    @HostBinding('style.display') display: string = 'contents';
}
