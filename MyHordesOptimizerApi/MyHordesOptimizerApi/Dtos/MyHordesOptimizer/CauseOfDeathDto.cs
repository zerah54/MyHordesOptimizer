using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CauseOfDeathDto
    {
        public const string DefaultLocale = "de";

        public int Dtype { get; set; }
        public string Ref { get; set; }
        public Dictionary<string, string> Description { get; set; }
        public string Icon { get; set; }
        public Dictionary<string, string> Label { get; set; }

        public CauseOfDeathDto()
        {
            Description = new Dictionary<string, string>();
            Label = new Dictionary<string, string>();
        }
    }
}
