using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Extensions
{
    public static class MyHordesExtensions
    {
        public static TownType GetTownType(this MyHordesMap map)
        {
            if (map.City.Hard)
            {
                return TownType.Pande;
            }
            else if (map.Wid >= 25)
            {
                return TownType.Re;
            }
            else
            {
                return TownType.Rne;
            }
        }
    }
}
