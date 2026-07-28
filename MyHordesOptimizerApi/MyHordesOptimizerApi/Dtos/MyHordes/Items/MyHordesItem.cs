using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Items
{
    /// <summary>
    /// Sortie de <c>getItemData</c>. Sert au référentiel <c>/json/items</c>, mais aussi aux objets
    /// posés dans la banque et au sol des zones, où <c>getArrayItem</c> ajoute
    /// <see cref="Count"/> et <see cref="Broken"/>.
    /// </summary>
    public class MyHordesItem
    {
        [JsonProperty("id")]
        public int? Id { get; set; }

        /// <summary>
        /// Nom de l'ICÔNE (<c>ItemPrototype::getIcon</c>), et non l'identifiant du prototype.
        /// Le nom du prototype (ex. <c>food_bag_#00</c>) est la CLÉ du dictionnaire renvoyé par
        /// <c>/json/items</c>, c'est lui qu'alimente <c>Item.Uid</c> côté MHO.
        /// </summary>
        [JsonProperty("uid")]
        public string? Uid { get; set; }

        [JsonProperty("name")]
        public IDictionary<string, string>? Label { get; set; }

        [JsonProperty("img")]
        public string? Img { get; set; }

        /// <summary>
        /// Icône de l'objet CASSÉ. Seul champ dérivé de tout le contrôleur MyHordes : il n'est pas
        /// demandable, il est émis en supplément par le <c>case 'img'</c> — et uniquement si
        /// l'objet a une icône cassée distincte (<c>if ($img_b !== $img)</c>), donc absent pour la
        /// plupart. Le rapport de couverture le signalera toujours comme « non demandé » : c'est
        /// normal, aucune chaîne <c>fields=</c> ne peut le contenir.
        /// </summary>
        [JsonProperty("img_b")]
        public string? ImgBroken { get; set; }

        [JsonProperty("cat")]
        public IDictionary<string, string>? Category { get; set; }

        [JsonProperty("heavy")]
        public bool? Heavy { get; set; }

        [JsonProperty("deco")]
        public int? Deco { get; set; }

        [JsonProperty("guard")]
        public int? Guard { get; set; }

        [JsonProperty("desc")]
        public IDictionary<string, string>? Description { get; set; }

        /// <summary>
        /// Ajouté par <c>getArrayItem</c> (banque, sol des zones). Le référentiel
        /// <c>/json/items</c> ne l'émet JAMAIS, même s'il est demandé : il passe par
        /// <c>getItemPrototypesData</c>, qui n'appelle pas <c>getArrayItem</c>.
        /// </summary>
        [JsonProperty("count")]
        public int? Count { get; set; }

        /// <summary>
        /// Ajouté par <c>getArrayItem</c>. Voir <see cref="Count"/> : jamais émis par
        /// <c>/json/items</c>.
        /// </summary>
        [JsonProperty("broken")]
        public bool? Broken { get; set; }
    }
}
