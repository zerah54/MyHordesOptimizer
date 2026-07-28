using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Town
{
    /// <summary>
    /// Réponse de <c>/json/townlist</c> : les identifiants de classement des villes.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Ne renvoie que les villes TERMINÉES : la requête filtre sur <c>t.town IS NULL</c>, donc les
    /// entrées de classement dont la ville vivante n'existe plus.
    /// </para>
    /// <para>
    /// Cet endpoint ne prend PAS de paramètre <c>fields=</c> — d'où son absence du registre de
    /// validation. Il accepte en revanche <c>season</c> (un numéro, <c>'b'</c> pour la bêta,
    /// <c>'a'</c> pour une saison nulle) et <c>language</c>, ce dernier n'étant pas exploité par
    /// MHO aujourd'hui — voir le chantier D.
    /// </para>
    /// </remarks>
    public class MyHordesTownListResponseDto
    {
        /// <summary>
        /// Initialisé plutôt que nullable : l'appelant traite une liste vide et une absence de la
        /// même façon, et MyHordes renvoie <c>{"towns": []}</c> quand aucune saison ne correspond.
        /// </summary>
        [JsonProperty("towns")]
        public List<int> Towns { get; set; } = new();
    }
}
