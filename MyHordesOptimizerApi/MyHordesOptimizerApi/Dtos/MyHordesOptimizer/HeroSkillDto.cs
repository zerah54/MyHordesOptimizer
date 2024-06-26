﻿using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class HeroSkillDto
    {
        public const string DefaultLocale = "de";

        public string Name { get; set; }
        public Dictionary<string, string> Description { get; set; }
        public string Icon { get; set; }
        public Dictionary<string, string> Label { get; set; }
        public int NbUses { get; set; }
        public int DaysNeeded { get; set; }

        public HeroSkillDto()
        {
            Description = new Dictionary<string, string>();
            Label = new Dictionary<string, string>();
        }
    }
}
