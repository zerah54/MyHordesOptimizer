using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    // Prototype de picto (/json/pictos). Référentiel complet et seule source de `community`, que le
    // champ `rewards` des joueurs ne porte pas. Le dictionnaire renvoyé est indexé par le NOM du
    // prototype (ex. « r_ripflash_#00 »), pas par son id.
    public class MyHordesApiPictoDto
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("img")]
        public string Img { get; set; }

        [JsonProperty("name")]
        public IDictionary<string, string> Name { get; set; }

        [JsonProperty("desc")]
        public IDictionary<string, string> Desc { get; set; }

        [JsonProperty("community")]
        public bool Community { get; set; }

        [JsonProperty("rare")]
        public bool Rare { get; set; }
    }
}
