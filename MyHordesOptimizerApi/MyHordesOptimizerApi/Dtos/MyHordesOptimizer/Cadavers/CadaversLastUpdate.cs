using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CadaversLastUpdate
    {
        public List<Cadaver> Cadavers { get; set; }
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public CadaversLastUpdate()
        {
            Cadavers = new List<Cadaver>();
        }
    }
}
