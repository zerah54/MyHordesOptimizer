using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class Citizen
    {
        #region MyHordes

        public int Id { get; set; }

        public string Name { get; set; }

        public bool IsGhost { get; set; }

        public bool Dead { get; set; }

        public string HomeMessage { get; set; }

        public string Avatar { get; set; }

        public string JobName { get; set; }
        public string JobUid { get; set; }

        public int X { get; set; }

        public int Y { get; set; }

        #endregion

        public int NombreJourHero { get; set; }

        public CitizenBag Bag { get; set; }
        public CitizenHome Home { get; set; }
        public CitizenStatus Status { get; set; }
        public CitizenActionsHeroic ActionsHeroic { get; set; }
        public Cadaver Cadaver { get; set; }

        public Citizen()
        {
            Bag = new CitizenBag();
            Cadaver = new Cadaver();
        }
    }
}
