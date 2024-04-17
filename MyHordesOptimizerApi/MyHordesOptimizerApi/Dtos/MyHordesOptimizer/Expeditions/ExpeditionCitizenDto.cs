using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions
{
    public class ExpeditionCitizenDto
    {
        public int? Id { get; set; }
        public int? IdUser { get; set; }
        public ExpeditionBagDto? Bag { get; set; }
        public List<ExpeditionOrderDto>? Orders { get; set; }
        public bool Preinscrit { get; set; }
        public string? PreinscritJob { get; set; }
        public string? PreinscritHeroicSkillName { get; set; }
        public int Pdc { get; set; }
        public int NombrePaDepart { get; set; }
        public bool? IsThirsty { get; set; }
    }
}
