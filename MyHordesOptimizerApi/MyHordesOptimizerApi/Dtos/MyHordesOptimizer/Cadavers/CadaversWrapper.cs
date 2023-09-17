using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CadaversWrapper
    {
        public List<Cadaver> Cadavers { get; set; }
        public LastUpdateInfo LastUpdateInfo { get; set; }

        public CadaversWrapper()
        {
            Cadavers = new List<Cadaver>();
        }
    }
}
