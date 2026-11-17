using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.PreTowns
{
    public class PreTownMemberDto
    {
        public int IdUser { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsOrganizer { get; set; }
    }

    public class PreTownDto
    {
        public int PreTownId { get; set; }
        /// <summary>Pseudo-mapId de la ville fantôme (PreTownIds.ToMapId).</summary>
        public int MapId { get; set; }
        public string Alias { get; set; } = string.Empty;
        public List<PreTownMemberDto> Members { get; set; } = new();
        public bool IsOrganizer { get; set; }
        public bool IsLinked { get; set; }
        public int? LinkedMapId { get; set; }
        public DateTime? LinkedAt { get; set; }
        public bool CanUnlink { get; set; }
        public int SimulatedCitizens { get; set; }
    }

    public class PreTownSummaryDto
    {
        public int PreTownId { get; set; }
        public int MapId { get; set; }
        public string Alias { get; set; } = string.Empty;
        public bool IsOrganizer { get; set; }
        public bool Seen { get; set; }
        public bool IsLinked { get; set; }
        public int MemberCount { get; set; }
    }

    public class PreTownAliasRequestDto
    {
        public string Alias { get; set; } = string.Empty;
    }

    public class PreTownSimulatedCitizensRequestDto
    {
        public int SimulatedCitizens { get; set; }
    }
}
