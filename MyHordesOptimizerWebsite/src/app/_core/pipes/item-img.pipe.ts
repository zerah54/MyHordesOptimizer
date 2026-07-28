import { Pipe, PipeTransform } from '@angular/core';

/** Tout porteur des deux icônes : le modèle `Item` comme les objets imbriqués des DTO. */
interface ItemIcons {
    img: string;
    img_broken?: string | null;
}

/**
 * Renvoie l'icône à afficher pour un objet, selon qu'il est cassé ou non.
 *
 * MyHordes ne définit une icône cassée que pour 20 objets sur 383 : pour tous les autres,
 * `img_broken` vaut `null` et c'est l'icône normale qui s'affiche. Le repli se décide donc ici,
 * au rendu, et jamais à l'import — y recopier `img` détruirait l'information.
 */
@Pipe({
    name: 'itemImg'
})
export class ItemImgPipe implements PipeTransform {
    public transform(item: ItemIcons | undefined | null, is_broken?: boolean | null): string {
        if (!item) {
            return '';
        }
        return is_broken && item.img_broken ? item.img_broken : item.img;
    }
}
