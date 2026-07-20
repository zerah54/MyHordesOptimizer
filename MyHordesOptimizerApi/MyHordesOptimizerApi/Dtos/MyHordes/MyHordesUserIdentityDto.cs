using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    // Réponse de /json/users : l'identité d'un joueur quelconque. Contrairement aux chemins
    // « cadavre » (getCadaversInformation, qui renvoie `getAlias() ?? getUser()->getName()`),
    // /json/users passe par getUserData et renvoie donc TOUJOURS le pseudo réel : c'est la seule
    // source faisant autorité sur Users.name pour un joueur qu'on n'a pas croisé vivant.
    public class MyHordesUserIdentityDto
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("avatar")]
        public string? Avatar { get; set; }
    }
}
