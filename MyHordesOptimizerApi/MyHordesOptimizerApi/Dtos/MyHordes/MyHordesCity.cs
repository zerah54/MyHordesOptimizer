using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>La ville elle-même, sortie de <c>getCityData</c>.</summary>
    public class MyHordesCity
    {
        [JsonProperty("name")]
        public string? Name { get; set; }

        /// <summary>Rations d'eau restantes dans le puits.</summary>
        [JsonProperty("water")]
        public int? Water { get; set; }

        /// <summary>Abscisse de la ville sur la carte, en repère MyHordes.</summary>
        [JsonProperty("x")]
        public int? X { get; set; }

        [JsonProperty("y")]
        public int? Y { get; set; }

        /// <summary>Porte ouverte.</summary>
        [JsonProperty("door")]
        public bool? Door { get; set; }

        [JsonProperty("chaos")]
        public bool? Chaos { get; set; }

        /// <summary>
        /// Vrai si le type de la ville est <c>panda</c>. Se déduit de <see cref="Type"/>, mais pas
        /// l'inverse : préférer <see cref="Type"/> quand les deux sont disponibles.
        /// </summary>
        [JsonProperty("hard")]
        public bool? Hard { get; set; }

        [JsonProperty("devast")]
        public bool? Devast { get; set; }

        /// <summary>
        /// Nom technique du type de ville (<c>remote</c>, <c>panda</c>, <c>custom</c>…). Plus
        /// informatif que <see cref="Hard"/>, qui n'en est qu'un cas particulier.
        /// </summary>
        [JsonProperty("type")]
        public string? Type { get; set; }

        /// <summary>Bâtiments NON construits (chantiers votables).</summary>
        [JsonProperty("chantiers")]
        public List<MyHordesBuildingDto>? Chantiers { get; set; }

        /// <summary>
        /// Bâtiments CONSTRUITS. Même type que <see cref="Chantiers"/> : côté MyHordes c'est le même
        /// appel <c>getChantiersData</c>, au seul drapeau <c>$complete</c> près.
        /// </summary>
        [JsonProperty("buildings")]
        public List<MyHordesBuildingDto>? Buildings { get; set; }

        /// <summary>
        /// La gazette du jour — un objet UNIQUE, pas une liste. TABLEAU VIDE au jour 1 (pas encore
        /// de gazette) ou si le rendu échoue, d'où le convertisseur.
        /// </summary>
        [JsonProperty("news")]
        [JsonConverter(typeof(EmptyPhpArrayConverter<MyHordesNews>))]
        public MyHordesNews? News { get; set; }

        [JsonProperty("defense")]
        public MyHordesDefense? Defense { get; set; }

        /// <summary>
        /// Améliorations des bâtiments. TABLEAU VIDE quand la ville n'a aucun bâtiment amélioré,
        /// d'où le convertisseur.
        /// </summary>
        [JsonProperty("upgrades")]
        [JsonConverter(typeof(EmptyPhpArrayConverter<MyHordesUpgradesRoot>))]
        public MyHordesUpgradesRoot? Upgrades { get; set; }

        /// <summary>
        /// Estimation de l'attaque de CETTE nuit. TABLEAU VIDE dans trois cas côté MyHordes :
        /// aucune estimation calculée, seuil de la tour de guet non atteint, ou pas de nuit
        /// suivante. D'où le convertisseur.
        /// </summary>
        [JsonProperty("estimations")]
        [JsonConverter(typeof(EmptyPhpArrayConverter<MyHordesEstimations>))]
        public MyHordesEstimations? Estimations { get; set; }

        /// <summary>Estimation de l'attaque de la nuit SUIVANTE. Voir <see cref="Estimations"/>.</summary>
        [JsonProperty("estimationsNext")]
        [JsonConverter(typeof(EmptyPhpArrayConverter<MyHordesEstimations>))]
        public MyHordesEstimations? EstimationsNext { get; set; }

        /// <summary>
        /// Contenu de la banque. Même entité que le référentiel des objets : <c>getBankData</c>
        /// passe par <c>getArrayItem</c>, qui appelle <c>getItemData</c> puis ajoute
        /// <c>count</c> et <c>broken</c>.
        /// </summary>
        [JsonProperty("bank")]
        public List<MyHordesItem>? Bank { get; set; }
    }
}
