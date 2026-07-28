using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Sortie de <c>getRewardsData</c> : le total des pictos d'un joueur, toutes villes confondues.
    /// MyHordes renvoie ici une LISTE, là où le champ <c>rewards</c> d'une entrée de classement
    /// renvoie un dictionnaire indexé par id de picto, restreint à UNE ville — voir
    /// <see cref="MyHordesTownPictoDto"/>. Les deux formes ne doivent pas être confondues.
    /// </summary>
    public class MyHordesReward
    {
        [JsonProperty("id")]
        public int? Id { get; set; }

        /// <summary>
        /// Entier, et non booléen : <c>getRewardsData</c> applique <c>intval()</c> là où le champ
        /// <c>rewards</c> d'un cadavre transmet le booléen brut. La divergence est voulue, elle
        /// suit le contrat.
        /// </summary>
        [JsonProperty("rare")]
        public int? Rare { get; set; }

        [JsonProperty("number")]
        public int? Number { get; set; }

        [JsonProperty("img")]
        public string? Img { get; set; }

        [JsonProperty("name")]
        public MyHordesLangString? Name { get; set; }

        [JsonProperty("desc")]
        public MyHordesLangString? Desc { get; set; }

        /// <summary>
        /// Libellés des titres débloqués. Déclenche une requête <c>AwardPrototype</c> par picto
        /// côté MyHordes. Voir <see cref="Unlocks"/>, plus riche pour le même coût.
        /// </summary>
        [JsonProperty("titles")]
        public List<MyHordesLangString>? Titles { get; set; }

        /// <summary>
        /// Commentaires du joueur sur ce picto. Déclenche une requête supplémentaire côté
        /// MyHordes : jamais demandé aujourd'hui.
        /// </summary>
        [JsonProperty("comments")]
        public List<string>? Comments { get; set; }

        /// <summary>
        /// Récompenses débloquées par ce picto. Version structurée et plus riche que
        /// <see cref="Titles"/>, qui ne renvoie que des libellés et rate les icônes. Même coût :
        /// une requête <c>AwardPrototype</c> par picto, à réserver à un import de référentiel.
        /// </summary>
        [JsonProperty("unlocks")]
        public List<MyHordesRewardUnlockDto>? Unlocks { get; set; }
    }
}
