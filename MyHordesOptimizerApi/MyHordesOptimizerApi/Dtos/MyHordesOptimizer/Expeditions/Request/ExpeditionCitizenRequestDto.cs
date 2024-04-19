using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request
{
    public class ExpeditionCitizenRequestDto
    {
        public int? Id { get; set; }
        public int? IdUser { get; set; }
        public int? BagId { get; set; }
        public List<int>? OrdersId { get; set; }
        public bool Preinscrit { get; set; }
        public string? PreinscritJob { get; set; }
        public string? PreinscritHeroicSkillName { get; set; }
        public int Pdc { get; set; }
        public int? NombrePaDepart { get; set; }
        public bool? IsPreinscritSoif { get; set; }
        public bool? IsThirsty { get; set; }
    }
}
