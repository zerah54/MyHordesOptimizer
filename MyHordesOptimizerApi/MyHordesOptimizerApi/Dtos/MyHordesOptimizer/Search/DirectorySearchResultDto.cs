using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Search
{
    /// <summary>
    /// Résultats de la recherche globale du site sur l'annuaire : joueurs et villes connus de MHO.
    /// </summary>
    public class DirectorySearchResultDto
    {
        public DirectorySearchGroupDto<PlayerSearchItemDto> Players { get; set; } = new();

        public DirectorySearchGroupDto<TownSearchItemDto> Towns { get; set; } = new();
    }

    /// <summary>Meilleurs résultats d'un groupe et nombre total de correspondances.</summary>
    public class DirectorySearchGroupDto<T>
    {
        public int Total { get; set; }

        public List<T> Items { get; set; } = new();
    }

    public class PlayerSearchItemDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public string? Avatar { get; set; }
    }

    /// <summary>Ville ouvrable sur le site : seules les villes dont le mapId est connu sont proposées.</summary>
    public class TownSearchItemDto
    {
        public int Id { get; set; }

        public int MapId { get; set; }

        public string Name { get; set; } = null!;

        public TownType? TownType { get; set; }

        public int? Season { get; set; }

        public TownPhase? Phase { get; set; }

        public string? Language { get; set; }

        public bool IsChaos { get; set; }

        public bool IsDevasted { get; set; }

        public bool IsFinished { get; set; }
    }

    /// <summary>Entrée du glossaire (sigles et abréviations des joueurs), partagé avec le bot Discord.</summary>
    public class GlossaryEntryDto
    {
        public string Word { get; set; } = null!;

        public string Definition { get; set; } = null!;
    }
}
