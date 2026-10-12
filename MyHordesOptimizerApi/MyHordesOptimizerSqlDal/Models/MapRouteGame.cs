using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>
/// Itinéraire créé dans MyHordes, importé en lecture seule et remplacé en bloc à chaque mise à jour MHO.
/// Le jeu les efface chaque nuit : seuls ceux du jour courant de la ville sont pertinents.
/// </summary>
[Table("MapRouteGame")]
[Index("IdTown", "Day", Name = "MapRouteGame_idTown_day")]
public partial class MapRouteGame
{
    [Key]
    [Column("idMapRouteGame", TypeName = "int(11)")]
    public int IdMapRouteGame { get; set; }

    /// <summary>Town.IdTown résolu via ResolveTownId (clé provisoire -mapId possible, migrée par MigrateTownId) — pas de FK.</summary>
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    /// <summary>Auteur dans MyHordes, s'il existe dans MHO.</summary>
    [Column("idAuthor", TypeName = "int(11)")]
    public int? IdAuthor { get; set; }

    [Column("label")]
    [StringLength(32)]
    public string Label { get; set; } = null!;

    [Column("length", TypeName = "int(11)")]
    public int Length { get; set; }

    /// <summary>Points d'arrêt, JSON [[x,y],…] en coordonnées absolues (segments alignés entre eux).</summary>
    [Column("stops", TypeName = "longtext")]
    public string Stops { get; set; } = null!;

    /// <summary>Jour de la ville à l'import.</summary>
    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }
}
