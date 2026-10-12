using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes
{
    public class MapRouteDto
    {
        public int Id { get; set; }
        public string Label { get; set; } = null!;

        /// <summary>Clé de palette (cf. MapRoutePalette) : la teinte affichée dépend du thème du site.</summary>
        public string Color { get; set; } = null!;

        public int AuthorId { get; set; }
        public string? AuthorName { get; set; }
        public bool IsPrivate { get; set; }
        public bool IsEditableByAll { get; set; }

        /// <summary>Citoyens autorisés à voir le tracé privé (vide s'il est visible de toute la ville).</summary>
        public List<int> SharedUserIds { get; set; } = new();

        public List<MapRoutePointDto> Cells { get; set; } = new();
        public List<MapRouteStopDto> Stops { get; set; } = new();

        /// <summary>PA du trajet : nombre de cases - 1.</summary>
        public int Length { get; set; }

        /// <summary>À renvoyer tel quel à l'enregistrement : refus si le tracé a été modifié entre-temps.</summary>
        public int Version { get; set; }

        /// <summary>L'utilisateur courant peut-il le modifier ou le supprimer.</summary>
        public bool CanEdit { get; set; }

        public List<MapRouteLinkedPartDto> LinkedParts { get; set; } = new();
        public LastUpdateInfoDto? LastUpdateInfo { get; set; }
    }
}
