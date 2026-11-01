using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>Proposition de plan de chantiers d'un jour (cf. 2026_10_13_town_building_plan.sql).</summary>
[Table("TownBuildingPlan")]
[Index("IdTown", "Day", Name = "TownBuildingPlan_idTown_day")]
public partial class TownBuildingPlan
{
    [Key]
    [Column("idTownBuildingPlan", TypeName = "int(11)")]
    public int IdTownBuildingPlan { get; set; }

    /// <summary>Town.IdTown résolu (clé provisoire -mapId possible, migrée par MigrateTownId) — pas de FK.</summary>
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    [Column("name")]
    [StringLength(64)]
    public string Name { get; set; } = null!;

    /// <summary>Une seule proposition effective par (ville, jour), garantie par le service.</summary>
    [Column("isEffective")]
    public bool IsEffective { get; set; }

    /// <summary>JSON de BuildingPlanContentDto.</summary>
    [Column("content", TypeName = "longtext")]
    public string Content { get; set; } = null!;

    /// <summary>Concurrence optimiste : incrémentée à chaque modification.</summary>
    [Column("version", TypeName = "int(11)")]
    [ConcurrencyCheck]
    public int Version { get; set; }

    [Column("idAuthor", TypeName = "int(11)")]
    public int IdAuthor { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    public virtual LastUpdateInfo? IdLastUpdateInfoNavigation { get; set; }
}
