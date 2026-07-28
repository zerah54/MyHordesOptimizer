using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Trajet d'une expédition. ATTENTION : MyHordes renvoie DEUX TABLEAUX PARALLÈLES, et non une
    /// liste de points — <c>X[i]</c> et <c>Y[i]</c> forment ensemble la i-ème case du trajet.
    /// </summary>
    /// <remarks>
    /// <c>getPointsExpedition</c> ignore les sous-champs demandés : <c>points.fields(x,y)</c> et
    /// <c>points</c> nu donnent le même résultat. Les coordonnées sont déjà converties en repère
    /// MyHordes (offset de la ville appliqué, axe Y inversé).
    /// </remarks>
    public class MyHordesExpeditionPointsDto
    {
        [JsonProperty("x")]
        public List<int>? X { get; set; }

        [JsonProperty("y")]
        public List<int>? Y { get; set; }
    }
}
