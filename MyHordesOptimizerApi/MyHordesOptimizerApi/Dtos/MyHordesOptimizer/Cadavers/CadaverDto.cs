namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CadaverDto
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

        public CauseOfDeathDto CauseOfDeath { get; set; }
        public CleanUpDto CleanUp { get; set; }

        public CadaverDto()
        {
            CleanUp = new CleanUpDto();
        }
    }
}
