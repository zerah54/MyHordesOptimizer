using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.UserAccount;

public class UserAccountPublicDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = null!;
    public string? Avatar { get; set; }
}

/// <summary>
/// Paramètres de l'annuaire des citoyens. Filtrage, tri et pagination côté serveur : la table
/// recense tous les joueurs croisés, pas seulement les utilisateurs de MHO.
/// </summary>
public class CitizenListQueryDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;

    public string? SortColumn { get; set; }
    public string? SortDirection { get; set; }

    public string? Name { get; set; }

    /// <summary>Restreint aux joueurs ayant partagé au moins une ville avec ce joueur.</summary>
    public int? SharedWithPlayerId { get; set; }
}

public class CitizenListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Avatar { get; set; }

    public int NbTownsPlayed { get; set; }
    public int? BestSurvival { get; set; }

    /// <summary>Dernière ville connue du joueur. Voir Users.lastTownId : proxy de récence.</summary>
    public int? LastTownId { get; set; }
    public string? LastTownName { get; set; }
    public int? LastTownSeason { get; set; }
}

public class CitizenListPageResultDto
{
    public List<CitizenListItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
}

public class UserPictosDto
{
    /// <summary>Date du dernier import des pictos du joueur. Null = jamais importé.</summary>
    public DateTime? HistoryImportedAt { get; set; }

    public List<UserPictoDto> Pictos { get; set; } = new();
}

public class UserPictoDto
{
    public int Id { get; set; }
    public string? Img { get; set; }
    public Dictionary<string, string?> Label { get; set; } = new();
    public Dictionary<string, string?> Description { get; set; } = new();
    public bool Rare { get; set; }

    /// <summary>Nombre total obtenu par le joueur, toutes villes confondues.</summary>
    public int Count { get; set; }

    /// <summary>
    /// Nombre obtenu dans la ville demandée. Null quand aucune ville n'est demandée : ce n'est
    /// pas un zéro, mais l'absence de la question.
    /// </summary>
    public int? CountInTown { get; set; }
}
