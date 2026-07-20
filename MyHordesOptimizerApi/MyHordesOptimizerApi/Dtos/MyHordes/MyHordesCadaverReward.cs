using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    // Picto obtenu par un citoyen dans une ville donnée (champ `rewards` de cadavers /
    // playedMaps). À demander NU (`rewards`) et non `rewards.fields(...)` : côté MyHordes,
    // la branche gérant les sous-champs est commentée et renverrait un objet vide.
    // Les champs ne sont donc pas filtrables. `community` n'y figure pas.
    public class MyHordesCadaverReward
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("rare")]
        public bool Rare { get; set; }

        [JsonProperty("number")]
        public int Number { get; set; }

        [JsonProperty("img")]
        public string Img { get; set; }

        [JsonProperty("name")]
        public IDictionary<string, string> Name { get; set; }

        [JsonProperty("desc")]
        public IDictionary<string, string> Desc { get; set; }
    }
}
