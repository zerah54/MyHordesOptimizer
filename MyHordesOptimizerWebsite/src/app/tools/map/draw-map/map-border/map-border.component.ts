import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'mho-map-border',
  templateUrl: './map-border.component.html',
  styleUrls: ['./map-border.component.scss', '../draw-map.component.scss']
})
export class MapBorderComponent {
  @HostBinding('style.display') display: string = 'contents';

  @Input() horizontal: boolean = false;
  @Input() vertical: boolean = false;
  @Input() index: null | number = null;
}
