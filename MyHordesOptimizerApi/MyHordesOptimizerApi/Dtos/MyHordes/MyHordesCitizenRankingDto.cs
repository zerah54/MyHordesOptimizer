using MyHordesOptimizerApi.Dtos.MyHordes.Contract;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Entrée de classement d'un citoyen dans une ville (<c>CitizenRankingProxy</c> côté
    /// MyHordes) : son historique, qu'il soit VIVANT OU MORT.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Sortie de <c>getCadaversInformation</c> — nom trompeur côté MyHordes : la fonction ne sert
    /// pas qu'aux cadavres. Un seul type pour quatre positions :
    /// </para>
    /// <list type="bullet">
    /// <item><c>map.cadavers</c> (/json/me) et <c>cadavers</c> (/json/map) : <c>getCadaversData</c>
    /// filtre <c>if (!$citizen-&gt;getAlive())</c>, donc les morts seulement.</item>
    /// <item><c>citizens</c> (/json/towns) : <c>getRankingInformation</c> passe TOUS les citoyens
    /// de la ville, sans filtre sur les vivants.</item>
    /// <item><c>playedMaps</c> (/json/user) : les vies passées du joueur.</item>
    /// </list>
    /// <para>
    /// À ne pas confondre avec <c>getUserData</c>, l'autre notion de « citoyen » de l'API, qui
    /// décrit un compte et son citoyen actif — c'est un type distinct.
    /// </para>
    /// <para>
    /// Les projections diffèrent fortement d'une position à l'autre : <c>playedMaps</c> ne demande
    /// ni <c>survival</c> ni <c>dtype</c>, et <c>/json/towns</c> filtre <c>sp</c> par whitelist.
    /// Aucune propriété ne peut donc être supposée présente — voir la règle « garder, ne pas
    /// replier » appliquée aux consommateurs.
    /// </para>
    /// </remarks>
    public class MyHordesCitizenRankingDto
    {
        [JsonProperty("id")]
        public int? Id { get; set; }

        [JsonProperty("twinId")]
        public int? TwinId { get; set; }

        /// <summary>Identifiant EternalTwin (<c>User::getEternalID</c>).</summary>
        [JsonProperty("etwinId")]
        public string? EtwinId { get; set; }

        [JsonProperty("mapId")]
        public int? MapId { get; set; }

        /// <summary>Jour où CE citoyen est mort (<c>CitizenRankingProxy::getDay</c>).</summary>
        [JsonProperty("survival")]
        public int? Survival { get; set; }

        /// <summary>
        /// Jour atteint par LA VILLE, à ne pas confondre avec <see cref="Survival"/>. Les deux
        /// ensemble donnent « mort au jour 7 dans une ville allée jusqu'au 21 ».
        /// </summary>
        [JsonProperty("day")]
        public int? Day { get; set; }

        /// <summary>Nom technique du type de la ville (<c>remote</c>, <c>panda</c>, <c>custom</c>…).</summary>
        [JsonProperty("type")]
        public string? Type { get; set; }

        /// <summary>Vrai si le type de la ville est <c>panda</c>.</summary>
        [JsonProperty("hard")]
        public bool? Hard { get; set; }

        /// <summary>
        /// URL de l'avatar, ou <c>null</c>. Cette projection est justement l'une de celles qui
        /// renvoient le booléen <c>false</c> — voir <see cref="AvatarUrlConverter"/>.
        /// </summary>
        [JsonProperty("avatar")]
        [JsonConverter(typeof(AvatarUrlConverter))]
        public string? Avatar { get; set; }

        /// <summary>
        /// Alias en ville (<c>alias ?? pseudo</c>), jamais le pseudo du compte : ne pas en
        /// alimenter <c>User.name</c>.
        /// </summary>
        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("mapName")]
        public string? MapName { get; set; }

        [JsonProperty("season")]
        public int? Season { get; set; }

        /// <summary><c>alpha</c>, <c>import</c>, <c>beta</c> ou <c>native</c>.</summary>
        [JsonProperty("phase")]
        public string? Phase { get; set; }

        /// <summary>Cause de la mort (<c>CauseOfDeath</c>), jamais nul côté MyHordes.</summary>
        [JsonProperty("dtype")]
        public int? Dtype { get; set; }

        /// <summary>Renvoie <c>0</c> EN DUR. Legacy, aucun intérêt.</summary>
        [JsonProperty("v1")]
        public int? V1 { get; set; }

        /// <summary>
        /// ATTENTION : le score de LA VILLE, répété à l'identique sur chaque entrée, et non celui
        /// du citoyen. Le score individuel est <see cref="Sp"/>. MyHordes peut renvoyer <c>null</c>
        /// ici (<c>$citizen->getTown()?->getScore()</c>). Voir le chantier C.
        /// </summary>
        [JsonProperty("score")]
        public int? Score { get; set; }

        /// <summary>
        /// Points d'âme gagnés dans cette ville par CE citoyen
        /// (<c>survivedDays × (survivedDays + 1) / 2</c>, remis à 0 par <c>DeathHandler</c> en cas
        /// de bannissement). Filtré par la whitelist de <c>getRankingInformation</c> : jamais émis
        /// par <c>/json/towns</c>, mais disponible sur <c>map.cadavers</c> et <c>playedMaps</c>.
        /// </summary>
        [MhUnavailableOn(MhEndpoints.Towns)]
        [JsonProperty("sp")]
        public int? Sp { get; set; }

        /// <summary>Derniers mots du citoyen.</summary>
        [JsonProperty("msg")]
        public string? Msg { get; set; }

        /// <summary>Commentaire laissé sur ce citoyen.</summary>
        [JsonProperty("comment")]
        public string? Comment { get; set; }

        [JsonProperty("cleanup")]
        public MyHordesCleanup? Cleanup { get; set; }

        /// <summary>
        /// Pictos obtenus par ce citoyen DANS cette ville, indexés par idPicto.
        /// </summary>
        /// <remarks>
        /// Doit être demandé NU : avec des sous-champs, la branche correspondante étant commentée
        /// côté MyHordes, la réponse serait un objet vide sans erreur. Coûte une requête SQL par
        /// ville, sans cache : à ne déclencher qu'à la demande, jamais en routine.
        /// Le convertisseur est indispensable — MyHordes sérialise ce tableau PHP en objet quand il
        /// est peuplé, mais en TABLEAU VIDE quand le citoyen n'a aucun picto.
        /// </remarks>
        [MhBare]
        [JsonProperty("rewards")]
        [JsonConverter(typeof(TownPictoRewardsConverter))]
        public IDictionary<string, MyHordesTownPictoDto>? Rewards { get; set; }

        /// <summary>
        /// Spécifique à <c>playedMaps</c> : code du site d'origine pour les villes importées
        /// (ex. <c>fr-12</c>). <c>getCadaversInformation</c> ne le produit pas, donc jamais émis
        /// sur <c>map.cadavers</c> même s'il y est demandé.
        /// </summary>
        [JsonProperty("origin")]
        public string? Origin { get; set; }
    }
}
