using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class Citizen
    {
        #region MyHordes

        public int Id { get; set; }

        public string Name { get; set; }

        public bool IsGhost { get; set; }

        public string HomeMessage { get; set; }

        public object Avatar { get; set; }

        public string JobName { get; set; }

        public int X { get; set; }

        public int Y { get; set; }

        #endregion

        public int NombreJourHero { get; set; }

        public List<CitizenItem> Bag { get; set; }

        public Citizen()
        {
            Bag = new List<CitizenItem>();
        }
    }
}
