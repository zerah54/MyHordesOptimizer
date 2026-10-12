namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes
{
    /// <summary>Droits de l'utilisateur courant sur les tracés de la ville.</summary>
    public class MapRouteAccessDto
    {
        /// <summary>Citoyen de la ville, vivant ou mort, actuel ou passé. Sinon (observateur) : aucun tracé renvoyé.</summary>
        public bool IsCitizen { get; set; }

        /// <summary>Ville de son jeton : faux pour un mort ou un ancien citoyen.</summary>
        public bool IsCurrentTown { get; set; }

        /// <summary>Peut créer un tracé : citoyen d'une ville non terminée.</summary>
        public bool CanCreate { get; set; }
    }
}
