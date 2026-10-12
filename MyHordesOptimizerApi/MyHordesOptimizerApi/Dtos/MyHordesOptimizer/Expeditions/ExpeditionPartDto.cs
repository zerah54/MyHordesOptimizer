using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions
{
    public class ExpeditionPartDto
    {
        public int? Id { get; set; }
        public List<ExpeditionOrderDto>? Orders { get; set; }
        public List<ExpeditionCitizenDto>? Citizens { get; set; }
        public int Position { get; set; }
        /// <summary>
        /// Ancien « Nom du tracé » (texte libre, supprimé) : vaut le nom du tracé lié, pour les scripts qui
        /// l'affichent encore. À retirer quand ils auront disparu.
        /// </summary>
        public string? Path { get; set; }
        public string? Label { get; set; }
        public string? Direction { get; set; }
        public int ExpeditionId { get; set; }

        /// <summary>Tracé lié ; null sans tracé, ou pour un observateur.</summary>
        public int? MapRouteId { get; set; }

        /// <summary>Résumé du tracé lié (toujours visible de toute la ville) ; null sans tracé, ou pour un observateur.</summary>
        public ExpeditionPartRouteDto? MapRoute { get; set; }
    }
}
