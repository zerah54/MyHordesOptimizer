namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes
{
    /// <summary>Destination cliquée lors de la saisie, et mode de calcul du segment qui y mène.</summary>
    public class MapRouteStopDto
    {
        public int X { get; set; }
        public int Y { get; set; }

        /// <summary><see cref="MapRouteStopModes.Best"/>, <see cref="MapRouteStopModes.L"/> ou <see cref="MapRouteStopModes.Items"/>.</summary>
        public string Mode { get; set; } = MapRouteStopModes.Best;
    }

    public static class MapRouteStopModes
    {
        /// <summary>Meilleur potentiel parmi les plus courts chemins.</summary>
        public const string Best = "best";

        /// <summary>Le plus direct, en L.</summary>
        public const string L = "l";

        /// <summary>
        /// Parmi les plus courts chemins, celui qui passe par le plus d'objets repérés. Les objets repérés sont propres
        /// à chaque joueur et ne sont pas enregistrés : le site recalcule avec ceux de la personne qui recalcule.
        /// </summary>
        public const string Items = "items";

        /// <summary>Mode connu du site.</summary>
        public static bool IsKnown(string? mode)
        {
            return mode == Best || mode == L || mode == Items;
        }
    }
}
