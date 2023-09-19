namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class Cadaver
    {
        #region MyHordes

        public int Id { get; set; }

        public string Name { get; set; }

        public string Avatar { get; set; }

        public int Survival { get; set; }
        public int Score { get; set; }

        public string Msg { get; set; }
        public string TownMsg { get; set; }

        #endregion

        public CauseOfDeath CauseOfDeath { get; set; }
        public CleanUp CleanUp { get; set; }

        public Cadaver()
        {
            CleanUp = new CleanUp();
        }
    }
}
