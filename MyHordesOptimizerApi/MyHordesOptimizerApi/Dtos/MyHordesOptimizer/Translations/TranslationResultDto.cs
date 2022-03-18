using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations
{
    public class TranslationResultDto
    {
        public List<string> Fr { get; set; }
        public List<string> Es { get; set; }
        public List<string> En { get; set; }
        public List<string> De { get; set; }

        public TranslationResultDto()
        {
            Fr = new List<string>();
            Es = new List<string>();
            En = new List<string>();
            De = new List<string>();
        }
    }
}
