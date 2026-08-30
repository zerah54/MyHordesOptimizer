using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models.CitizenState
{
    public class CitizenState
    {
        public int Ap { get; set; }
        public int Sp { get; set; }
        public bool Wounded { get; set; }
        public bool IsEclaireur { get; set; }
        public bool HasBike { get; set; }
        public bool HasShoes { get; set; }
        public int WalkingDistance { get; set; }
        public bool IsDead { get; set; }
        public HashSet<string> Statuses { get; set; } = new();
        public bool HasShield { get; set; }
        public bool HasDefenceCpItem { get; set; }
        public bool IsGuide { get; set; }
        public int ZoneCitizenCount { get; set; }
        public bool HasCleanPdcPerk { get; set; }
        public bool HasHydratedPdcPerk { get; set; }
        public bool HasSoberPdcPerk { get; set; }
        public bool HasBaseZoneControlPerk { get; set; }
        public bool HasUsedDrugToday { get; set; }
        public bool IsRoleGhoul { get; set; }
    }
}
