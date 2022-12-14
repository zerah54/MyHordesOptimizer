using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen
{
    public class GestHordesMajCitizenRequest
    {
        [JsonProperty("idMh")]
        public int IdMh { get; set; }

        [JsonProperty("userKey")]
        public string UserKey { get; set; }

        [JsonProperty("actionsHero")]
        public GestHordesMajCitizenActionsHeroDto ActionsHero { get; set; }

        [JsonProperty("maison")]
        public GestHordesMajCitizenMaisonDto Maison { get; set; }

        [JsonProperty("coffre")]
        public List<GestHordesMajCitizenCoffreItemDto> Coffre { get; set; }

        public GestHordesMajCitizenRequest(int idMh, string userKey)
        {
            IdMh = idMh;
            UserKey = userKey;
            ActionsHero = new GestHordesMajCitizenActionsHeroDto();
            Maison = new GestHordesMajCitizenMaisonDto();
            Coffre = new List<GestHordesMajCitizenCoffreItemDto>();
        }
    }
}
