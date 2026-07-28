using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Auteur d'une expédition (<c>getAuthorInformation</c>).
    /// </summary>
    /// <remarks>
    /// Cette branche IGNORE les sous-champs demandés : elle renvoie toujours les trois champs, quoi
    /// qu'on écrive dans <c>author.fields(...)</c>. Comme sur les chemins de classement,
    /// <see cref="Avatar"/> vaut le booléen <c>false</c> quand le joueur n'a pas d'avatar, que
    /// Newtonsoft convertit en chaîne <c>"false"</c> — voir le chantier G.
    /// </remarks>
    public class MyHordesExpeditionAuthorDto
    {
        [JsonProperty("id")]
        public int? Id { get; set; }

        /// <summary>Nom du citoyen (<c>getOwner()-&gt;getName()</c>), donc potentiellement un alias.</summary>
        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("avatar")]
        public string? Avatar { get; set; }
    }
}
