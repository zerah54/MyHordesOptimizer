using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CitizensWrapper
    {
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public Dictionary<string, Citizen> Citizens { get; set; }

        public CitizensWrapper(IDictionary<string, Citizen> dictionary)
        {
            Citizens = new Dictionary<string, Citizen>(dictionary);
        }

        public CitizensWrapper()
        {
            Citizens = new Dictionary<string, Citizen>();
        }
    }
}
