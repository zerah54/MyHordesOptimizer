using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.UserAvailability
{
    public class MyHordesOptimizerUserAvailabilityType
    {
        public int IdType { get; set; }
        public Dictionary<string, string> Names { get; set; }

        public MyHordesOptimizerUserAvailabilityType()
        {
            Names = new Dictionary<string, string>();
        }
    }
}
