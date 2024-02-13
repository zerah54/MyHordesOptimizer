using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CitizensLastUpdate
    {
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public List<Citizen> Citizens { get; set; }

        public CitizensLastUpdate(List<Citizen> dictionary)
        {
            Citizens = new List<Citizen>(dictionary);
        }

        public CitizensLastUpdate()
        {
            Citizens = new List<Citizen>();
        }
    }
}
