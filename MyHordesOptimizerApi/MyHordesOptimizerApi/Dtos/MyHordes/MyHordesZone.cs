using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>Une case de la carte, sortie de <c>getZonesData</c>.</summary>
    /// <remarks>
    /// Seules les cases découvertes sont renvoyées (<c>DiscoveryStateNone</c> exclu).
    /// <see cref="X"/> et <see cref="Y"/> sont ajoutés d'office par MyHordes même s'ils ne sont pas
    /// demandés, la liste étant triée dessus.
    /// </remarks>
    public class MyHordesZone
    {
        [JsonProperty("x")]
        public int? X { get; set; }

        [JsonProperty("y")]
        public int? Y { get; set; }

        /// <summary>
        /// <c>0</c> si la case est vue à jour, <c>1</c> sinon (« non vue tôt »). C'est l'inverse
        /// d'un drapeau « à jour ».
        /// </summary>
        [JsonProperty("nvt")]
        public int? Nvt { get; set; }

        /// <summary>
        /// <c>0</c>/<c>1</c> : case dont le sol a été régénéré par la capacité héroïque Fouineur
        /// (<c>HeroicItemActionListener</c> type 24 → <c>RegenerateZoneAction</c>). Marqueur
        /// permanent. Jamais demandé aujourd'hui.
        /// </summary>
        [JsonProperty("exc")]
        public int? Exc { get; set; }

        /// <summary>
        /// Référence du marqueur posé sur la case (<c>ZoneTag::getRef()</c>). ABSENT quand la case
        /// n'a pas de marqueur, ou que celui-ci vaut <c>TagNone</c>.
        /// </summary>
        [JsonProperty("tag")]
        public int? Tag { get; set; }

        /// <summary>
        /// Niveau de danger, de <c>0</c> à <c>3</c>, déduit du nombre de zombies. N'est renvoyé que
        /// pour les cases vues à jour (<c>DiscoveryStateCurrent</c>).
        /// </summary>
        [JsonProperty("danger")]
        public int? Danger { get; set; }

        /// <summary>
        /// Détails de la case. Ses trois champs sont conditionnels côté MyHordes — <c>z</c> et
        /// <c>dried</c> réservés à la case de l'appelant, <c>h</c> exclu en chaos — donc la branche
        /// est un TABLEAU VIDE pour la quasi-totalité des cases, d'où le convertisseur.
        /// </summary>
        [JsonProperty("details")]
        [JsonConverter(typeof(EmptyPhpArrayConverter<MyHordesDetails>))]
        public MyHordesDetails? Details { get; set; }

        /// <summary>
        /// Bâtiment de la case. Renvoyé UNIQUEMENT si la case a un prototype de bâtiment.
        /// </summary>
        [JsonProperty("building")]
        public MyHordesRuin? Building { get; set; }

        /// <summary>
        /// Objets au sol. Renvoyés UNIQUEMENT pour la case où se trouve l'appelant, et seulement
        /// hors chaos. Même entité que le référentiel des objets, via <c>getArrayItem</c>.
        /// </summary>
        [JsonProperty("items")]
        public List<MyHordesItem>? Items { get; set; }
    }
}
