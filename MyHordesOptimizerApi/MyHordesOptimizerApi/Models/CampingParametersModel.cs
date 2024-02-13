using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Models
{
    public class CampingParametersModel
    {
            public TownType TownType { get; set; }
            public string Job { get; set; }
            public int Distance { get; set; }
            public int Campings { get; set; }
            public bool ProCamper { get; set; }
            public int HiddenCampers { get; set; }
            public int Objects { get; set; }
            public bool Vest { get; set; }
            public bool Tomb { get; set; }
            public int Zombies { get; set; }
            public bool Night { get; set; }
            public bool Devastated { get; set; }
            public bool Phare { get; set; }
            public int Improve { get; set; }
            public int ObjectImprove { get; set; }
            public int RuinBonus { get; set; } 
            public int RuinBuryCount { get; set; } 
            public int RuinCapacity { get; set; } 
    }
}
