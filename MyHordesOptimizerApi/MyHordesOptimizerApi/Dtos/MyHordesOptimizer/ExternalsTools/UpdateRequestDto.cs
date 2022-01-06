namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public class UpdateRequestDto
    {
        public bool IsFataMorgana { get; set; }
        public bool IsBigBrothHordes { get; set; }
        public bool IsGestHordes { get; set; }

        public string GestHordesCookies { get;set; }
    }
}
