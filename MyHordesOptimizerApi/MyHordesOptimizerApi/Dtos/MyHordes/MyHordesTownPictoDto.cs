using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Picto obtenu par un citoyen DANS UNE VILLE donnée : le champ <c>rewards</c> porté par
    /// <see cref="MyHordesCitizenRankingDto"/>, quelle que soit la position (<c>cadavers</c>,
    /// <c>playedMaps</c>). MyHordes renvoie ici un DICTIONNAIRE indexé par id de picto, là où
    /// <c>getRewardsData</c> renvoie une LISTE du total tous jeux confondus — voir
    /// <see cref="MyHordesReward"/>. Les deux formes ne doivent pas être confondues.
    /// </summary>
    /// <remarks>
    /// À demander NU (<c>rewards</c>) et non <c>rewards.fields(...)</c> : côté MyHordes la branche
    /// gérant les sous-champs est commentée et renverrait un objet vide, sans erreur. Les champs
    /// ne sont donc pas filtrables, et <c>community</c> n'y figure pas.
    /// </remarks>
    public class MyHordesTownPictoDto
    {
        [JsonProperty("id")]
        public int? Id { get; set; }

        /// <summary>
        /// Booléen, et non entier : cette branche transmet <c>getRare()</c> brut là où
        /// <c>getRewardsData</c> applique <c>intval()</c>. La divergence suit le contrat.
        /// </summary>
        [JsonProperty("rare")]
        public bool? Rare { get; set; }

        [JsonProperty("number")]
        public int? Number { get; set; }

        [JsonProperty("img")]
        public string? Img { get; set; }

        [JsonProperty("name")]
        public MyHordesLangString? Name { get; set; }

        [JsonProperty("desc")]
        public MyHordesLangString? Desc { get; set; }
    }
}
