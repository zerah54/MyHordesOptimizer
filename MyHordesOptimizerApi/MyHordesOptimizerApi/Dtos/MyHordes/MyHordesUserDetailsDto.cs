using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Un compte joueur avec ses branches imbriquées : la sortie de <c>getUserData</c> telle que
    /// <c>/json/me</c> et <c>/json/user</c> la renvoient.
    /// </summary>
    /// <remarks>
    /// <para>
    /// La scission avec <see cref="MyHordesUserDto"/> n'est pas cosmétique : <c>getCitizensData</c>
    /// RETIRE <c>map</c> de la liste des champs avant de déléguer, donc un citoyen de
    /// <c>map.citizens</c> ne peut jamais porter de carte. Garder <see cref="Map"/> ici plutôt que
    /// sur le type de base rend cet état irreprésentable, et supprime au passage le cycle de types
    /// <c>User → Map → List&lt;User&gt;</c>.
    /// </para>
    /// <para>
    /// <c>contacts</c> est le seul champ du contrat volontairement NON typé : il n'existe que sur
    /// <c>/json/me</c>, est récursif avec les mêmes champs, coûte un <c>getUserData</c> complet par
    /// ami, et n'a aucun usage. L'ajouter réintroduirait un cycle pour rien.
    /// </para>
    /// </remarks>
    public class MyHordesUserDetailsDto : MyHordesUserDto
    {
        /// <summary>
        /// La ville du citoyen actif.
        /// </summary>
        /// <remarks>
        /// PIÈGE : <c>map.fields(...)</c> n'est honoré que si le joueur interrogé EST l'appelant
        /// (<c>getUserData</c>, l. 1689). Sur un tiers, MyHordes ignore les sous-champs demandés en
        /// silence et substitue une liste figée — le contenu de cette propriété dépend donc de QUI
        /// l'on interroge, pas seulement de ce qu'on demande.
        /// </remarks>
        [JsonProperty("map")]
        public MyHordesMap? Map { get; set; }

        /// <summary>
        /// Vies passées du joueur, chacune avec les pictos gagnés dans la ville correspondante.
        /// Ne contient jamais la ville en cours quand le joueur y est encore vivant : MyHordes
        /// l'exclut de <c>playedMaps</c>.
        /// </summary>
        /// <remarks>
        /// APPEL LOURD dès qu'on y demande <c>rewards</c> : une requête SQL par ville côté
        /// MyHordes, sans cache, plus de cent pour un vétéran. À ne déclencher qu'à la demande.
        /// </remarks>
        [JsonProperty("playedMaps")]
        public List<MyHordesCitizenRankingDto>? PlayedMaps { get; set; }

        /// <summary>
        /// Total des pictos du joueur, toutes villes confondues (table <c>PictoRollup</c> côté
        /// MyHordes). Inclut les imports Twinoid, contrairement à la somme des
        /// <see cref="PlayedMaps"/>.
        /// </summary>
        [JsonProperty("rewards")]
        public List<MyHordesReward>? Rewards { get; set; }
    }
}
