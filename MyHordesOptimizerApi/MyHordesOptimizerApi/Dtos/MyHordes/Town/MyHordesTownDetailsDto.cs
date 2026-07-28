using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Town
{
    public class MyHordesTownDetailsDto : MyHordesTownListItemDto
    {
        /// <summary>
        /// TOUS les citoyens de la ville, vivants comme morts : <c>getRankingInformation</c> passe
        /// l'intégralité de <c>$town-&gt;getCitizens()</c> sans filtrer sur les vivants, à la
        /// différence de <c>map.cadavers</c> qui, lui, ne garde que les morts. D'où le type
        /// partagé.
        /// </summary>
        /// <remarks>
        /// Cet endpoint applique une whitelist (<c>array_intersect</c>) qui limite les sous-champs
        /// à <c>id, twinId, etwinId, survival, avatar, name, dtype, score, msg, comment</c> :
        /// <c>sp</c> en est exclu, d'où l'attribut <c>MhUnavailableOn</c> qui le porte.
        /// </remarks>
        [JsonProperty("citizens")]
        public List<MyHordesCitizenRankingDto>? Citizens { get; set; }
    }
}
