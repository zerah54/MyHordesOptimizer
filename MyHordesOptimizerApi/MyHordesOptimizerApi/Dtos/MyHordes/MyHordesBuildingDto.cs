using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Un bâtiment de LA VILLE, sortie de <c>getChantiersData</c>. Sert aux deux positions
    /// <c>city.chantiers</c> (non construits) et <c>city.buildings</c> (construits) : côté MyHordes
    /// c'est le même appel, au seul drapeau <c>$complete</c> près.
    /// </summary>
    /// <remarks>
    /// À ne pas confondre avec <c>MyHordesApiBuildingDto</c>, le référentiel <c>/json/buildings</c>
    /// hors ville. Sur ce type-ci, <see cref="PaCurrent"/>, <see cref="RarityCurrent"/>,
    /// <see cref="ResourcesCurrent"/> et <see cref="Difficulty"/> portent de VRAIES valeurs,
    /// ajustées à la configuration de la ville — sur le référentiel ce sont de simples alias.
    /// </remarks>
    public class MyHordesBuildingDto
    {
        [JsonProperty("id")]
        public int? Id { get; set; }

        [JsonProperty("icon")]
        public string? Icon { get; set; }

        [JsonProperty("name")]
        public MyHordesLangString? Name { get; set; }

        [JsonProperty("desc")]
        public MyHordesLangString? Desc { get; set; }

        /// <summary>Coût en PA du PROTOTYPE (<c>getResourceSet()-&gt;getAp()</c>).</summary>
        [JsonProperty("pa")]
        public int? Pa { get; set; }

        /// <summary>
        /// Coût en PA RÉEL dans cette ville, ajusté par la rareté configurée. Diffère de
        /// <see cref="Pa"/> — c'est celui-ci qu'il faut afficher.
        /// </summary>
        [JsonProperty("paCurrent")]
        public int? PaCurrent { get; set; }

        /// <summary>PV actuels du bâtiment (<c>getHp()</c>).</summary>
        [JsonProperty("life")]
        public int? Life { get; set; }

        /// <summary>PV maximum du prototype.</summary>
        [JsonProperty("maxLife")]
        public int? MaxLife { get; set; }

        /// <summary>Nombre de votes en faveur de ce chantier.</summary>
        [JsonProperty("votes")]
        public int? Votes { get; set; }

        [JsonProperty("breakable")]
        public bool? Breakable { get; set; }

        [JsonProperty("def")]
        public int? Def { get; set; }

        [JsonProperty("hasUpgrade")]
        public bool? HasUpgrade { get; set; }

        /// <summary>Rareté du plan telle que définie sur le PROTOTYPE.</summary>
        [JsonProperty("rarity")]
        public int? Rarity { get; set; }

        /// <summary>
        /// Rareté du plan DANS CETTE VILLE. Diffère de <see cref="Rarity"/> selon la configuration.
        /// </summary>
        [JsonProperty("rarityCurrent")]
        public int? RarityCurrent { get; set; }

        /// <summary>Niveau de difficulté du bâtiment (<c>getDifficultyLevel()</c>).</summary>
        [JsonProperty("difficulty")]
        public int? Difficulty { get; set; }

        /// <summary>
        /// Ordre d'affichage officiel du jeu (<c>getOrderBy()</c>) : permet de reproduire le tri de
        /// MyHordes au lieu d'en inventer un.
        /// </summary>
        [JsonProperty("order")]
        public int? Order { get; set; }

        [JsonProperty("temporary")]
        public bool? Temporary { get; set; }

        /// <summary>Id du bâtiment parent, ou <c>0</c> s'il n'y en a pas.</summary>
        [JsonProperty("parent")]
        public int? Parent { get; set; }

        /// <summary>Ressources requises par le PROTOTYPE.</summary>
        [JsonProperty("resources")]
        public List<MyHordesResourceRoot>? Resources { get; set; }

        /// <summary>
        /// Ressources réellement requises pour CE chantier dans cette ville. Diffère de
        /// <see cref="Resources"/>.
        /// </summary>
        [JsonProperty("resourcesCurrent")]
        public List<MyHordesResourceRoot>? ResourcesCurrent { get; set; }

        /// <summary>
        /// PA restant à investir : le coût ajusté moins ce qui a déjà été apporté
        /// (<c>getPrototypeAP(...) - getAp()</c>).
        /// </summary>
        [JsonProperty("actions")]
        public int? Actions { get; set; }

        /// <summary>
        /// Niveau du bâtiment (<c>getLevel()</c>) — un ENTIER malgré le nom, pas un booléen.
        /// </summary>
        [JsonProperty("hasLevels")]
        public int? HasLevels { get; set; }
    }
}
