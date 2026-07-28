using MyHordesOptimizerApi.Models;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Une ville et sa carte, sortie de <c>getMapData</c>. Sert de racine à <c>/json/map</c> et de
    /// branche <c>map</c> sur <c>/json/me</c>.
    /// </summary>
    /// <remarks>
    /// Cet appel peut renvoyer <c>{"error": "ApiDisabled"}</c> si la ville a désactivé l'option API,
    /// ou <c>{"error": "UnknownMap"}</c> sur un mapId inconnu — dans les deux cas aucune propriété
    /// n'est renseignée.
    /// </remarks>
    public class MyHordesMap
    {
        /// <summary>
        /// Motif d'échec renvoyé À LA PLACE des données : <c>ApiDisabled</c> quand la ville a
        /// désactivé l'option d'API externe, <c>UnknownMap</c> sur un mapId inconnu.
        /// </summary>
        /// <remarks>
        /// Les deux n'ont pas le même sens. <c>ApiDisabled</c> décrit une propriété DURABLE de la
        /// ville, qu'il vaut la peine de retenir ; <c>UnknownMap</c> ne dit rien d'elle, seulement
        /// que l'identifiant demandé ne correspond à rien.
        /// </remarks>
        [JsonProperty("error")]
        public string? Error { get; set; }

        /// <summary>Identifiant interne de la ville (townId MyHordes).</summary>
        [JsonProperty("id")]
        public int? Id { get; set; }

        /// <summary>Horodatage de la réponse, au format <c>Y-m-d H:i:s</c>.</summary>
        [JsonProperty("date")]
        public string? Date { get; set; }

        [JsonProperty("wid")]
        public int? Wid { get; set; }

        [JsonProperty("hei")]
        public int? Hei { get; set; }

        /// <summary>Vrai quand la progression de l'insurrection atteint 100.</summary>
        [JsonProperty("conspiracy")]
        public bool? Conspiracy { get; set; }

        /// <summary>Points de bonus de la ville.</summary>
        [JsonProperty("bonusPts")]
        public int? BonusPts { get; set; }

        /// <summary>Jour courant de la ville.</summary>
        [JsonProperty("days")]
        public int? Days { get; set; }

        [JsonProperty("custom")]
        public bool? Custom { get; set; }

        [JsonProperty("season")]
        public int? Season { get; set; }

        /// <summary><c>alpha</c>, <c>import</c>, <c>beta</c> ou <c>native</c>.</summary>
        [JsonProperty("phase")]
        public string? Phase { get; set; }

        /// <summary>
        /// Pour les villes importées, le site d'origine (<c>www.hordes.fr</c>,
        /// <c>www.die2nite.com</c>, <c>www.dieverdammten.de</c>, <c>www.zombinoia.com</c>) ;
        /// <c>www.myhordes.eu</c> sinon. Jamais demandé aujourd'hui.
        /// </summary>
        [JsonProperty("source")]
        public string? Source { get; set; }

        /// <summary>Langue de la ville. Peut changer en cours de partie — voir le chantier D.</summary>
        [JsonProperty("language")]
        public string? Language { get; set; }

        /// <summary>
        /// Id du joueur portant le rôle de Guide de l'Outre-Monde. ABSENT si le porteur est mort ou
        /// s'il n'y en a pas : côté MyHordes le champ n'est assigné que si le rôle a un titulaire
        /// vivant.
        /// </summary>
        [JsonProperty("guide")]
        public int? Guide { get; set; }

        /// <summary>Id du Chaman vivant. Même conditionnalité que <see cref="Guide"/>.</summary>
        [JsonProperty("shaman")]
        public int? Shaman { get; set; }

        /// <summary>
        /// Id du Responsable de la catapulte vivant. Même conditionnalité que <see cref="Guide"/>.
        /// Rôle ajouté récemment par MyHordes, jamais demandé jusqu'ici — voir le chantier B.
        /// </summary>
        [JsonProperty("cata")]
        public int? Cata { get; set; }

        [JsonProperty("city")]
        public MyHordesCity? City { get; set; }

        /// <summary>Citoyens VIVANTS de la ville. <c>getCitizensData</c> délègue à <c>getUserData</c>.</summary>
        [JsonProperty("citizens")]
        public List<MyHordesUserDto>? Citizens { get; set; }

        /// <summary>
        /// Citoyens MORTS uniquement : <c>getCadaversData</c> filtre sur <c>!getAlive()</c>. Le type
        /// est partagé avec <c>towns.citizens</c>, qui lui ne filtre pas.
        /// </summary>
        [JsonProperty("cadavers")]
        public List<MyHordesCitizenRankingDto>? Cadavers { get; set; }

        [JsonProperty("zones")]
        public List<MyHordesZone>? Zones { get; set; }

        [JsonProperty("expeditions")]
        public List<MyHordesExpeditionDto>? Expeditions { get; set; }

        /// <summary>
        /// NON DÉSÉRIALISÉ : véhicule interne MHO, sans <c>[JsonProperty]</c>. Le fetcher y dépose
        /// l'enregistrement de synchronisation que le mapping relit ensuite. Sa place ici est
        /// discutable — c'est un modèle de persistance dans un DTO de contrat — mais le retirer
        /// exige de concevoir un chemin de remplacement, hors périmètre du chantier A.
        /// </summary>
        public LastUpdateInfo? LastUpdateInfo { get; set; }
    }
}
