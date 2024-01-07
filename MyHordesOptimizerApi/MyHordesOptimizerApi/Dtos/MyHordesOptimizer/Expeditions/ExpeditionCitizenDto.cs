using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Bag;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions
{
    public class ExpeditionCitizenDto
    {
        public int? Id { get; set; }
        public int? IdUser { get; set; }
        public List<BagItemDto> Items { get; set; }
        public List<ExpeditionOrderDto> Order { get; set; }
        public bool Preinscrit { get; set; }
        public string? PreinscritJob { get; set; }
        [JsonProperty("preinscritHeroic")]
        public string? PreinscritHeroicSkillName { get; set; }
        public int Pdc { get; set; }
        [JsonProperty("soif")]
        public bool? IsThirsty { get; set; }
    }
}
