namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes
{
    /// <summary>Destination cliquée lors de la saisie, et mode de calcul du segment qui y mène.</summary>
    public class MapRouteStopDto
    {
        public int X { get; set; }
        public int Y { get; set; }

        /// <summary><see cref="MapRouteStopModes.Best"/> ou <see cref="MapRouteStopModes.L"/>.</summary>
        public string Mode { get; set; } = MapRouteStopModes.Best;
    }

    public static class MapRouteStopModes
    {
        /// <summary>Meilleur potentiel parmi les plus courts chemins.</summary>
        public const string Best = "best";

        /// <summary>Le plus direct, en L.</summary>
        public const string L = "l";
    }
}
