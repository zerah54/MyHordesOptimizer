using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch
{
    public class NightwatchPlanDto
    {
        public int Id { get; set; }
        public int Day { get; set; }
        public string Name { get; set; } = "";
        public bool IsEffective { get; set; }
        public int Version { get; set; }
        public int AuthorId { get; set; }
        public string? AuthorName { get; set; }
        public NightwatchPlanContentDto Content { get; set; } = new();
        public LastUpdateInfoDto? LastUpdateInfo { get; set; }
    }

    public class NightwatchPlanAccessDto
    {
        public bool IsCitizen { get; set; }
        /// <summary>Citoyen d'une ville non terminée.</summary>
        public bool CanEdit { get; set; }
    }

    public class NightwatchPlansDto
    {
        public NightwatchPlanAccessDto Access { get; set; } = new();
        public List<NightwatchPlanDto> Plans { get; set; } = new();
    }
}
