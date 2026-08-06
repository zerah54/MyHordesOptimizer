namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens
{
    public class DailyActionDto
    {
        public string ActionKey { get; set; }
        public int Day { get; set; }
        public LastUpdateInfoDto LastUpdateInfo { get; set; }
    }
}
