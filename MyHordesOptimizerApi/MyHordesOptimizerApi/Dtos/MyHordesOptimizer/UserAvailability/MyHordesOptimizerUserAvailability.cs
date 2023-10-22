using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.UserAvailability
{
    public class MyHordesOptimizerUserAvailability
    {
        public int Id { get; set; }
        public int IdUser { get; set; }
        public int IdTown { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public MyHordesOptimizerUserAvailabilityType Type { get; set; }
        public string Comment { get; set; }
        public bool CanLead { get; set; }
    }
}
