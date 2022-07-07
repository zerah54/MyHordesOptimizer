using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CitizensWrapper
    {
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public List<Citizen> Citizens { get; set; }

        public CitizensWrapper(List<Citizen> dictionary)
        {
            Citizens = new List<Citizen>(dictionary);
        }

        public CitizensWrapper()
        {
            Citizens = new List<Citizen>();
        }
    }
}
