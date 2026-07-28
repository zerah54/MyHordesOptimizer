using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Town
{
    /// <summary>
    /// Une ville du CLASSEMENT, sortie de <c>getRankingInformation</c> (<c>/json/towns</c>).
    /// </summary>
    /// <remarks>
    /// Cet endpoint n'expose NI <c>city</c>, NI <c>wid</c>, NI <c>hei</c> — testé en réel le
    /// 2026-07-09 sur <c>.de</c> et <c>.eu</c>, et confirmé par la source : le <c>switch</c> de
    /// <c>getRankingInformation</c> ne connaît que les champs ci-dessous. Taille, position et type
    /// de ville ne viennent que de <c>/json/map</c>.
    /// </remarks>
    public class MyHordesTownListItemDto
    {
        /// <summary>
        /// Identifiant de l'entrée de CLASSEMENT (<c>TownRankingProxy</c>), à ne pas confondre avec
        /// <see cref="MapId"/>.
        /// </summary>
        [JsonProperty("id")]
        public int? Id { get; set; }

        /// <summary>
        /// Identifiant d'origine de la ville (<c>getBaseID()</c>), ou <c>-1</c> s'il n'y en a pas.
        /// C'est lui qui est recyclé d'une saison à l'autre.
        /// </summary>
        [JsonProperty("mapId")]
        public int? MapId { get; set; }

        [JsonProperty("mapName")]
        public string? Name { get; set; }

        /// <summary>Nombre de jours qu'a duré la ville.</summary>
        [JsonProperty("day")]
        public int? Day { get; set; }

        [JsonProperty("language")]
        public string? Language { get; set; }

        [JsonProperty("season")]
        public int? Season { get; set; }

        /// <summary><c>alpha</c>, <c>import</c>, <c>beta</c> ou <c>native</c>.</summary>
        [JsonProperty("phase")]
        public string? Phase { get; set; }

        /// <summary>Renvoie <c>0</c> EN DUR. Legacy, aucun intérêt.</summary>
        [JsonProperty("v1")]
        public int? V1 { get; set; }

        /// <summary>Score de la ville. Seule source de cette valeur.</summary>
        [JsonProperty("score")]
        public int? Score { get; set; }
    }
}
