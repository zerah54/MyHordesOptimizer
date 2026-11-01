using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models;

/// <summary>Valeur en PA des objets, par ville (cf. 2026_10_13_town_building_plan.sql).</summary>
[Table("TownBuildingPlanSettings")]
public partial class TownBuildingPlanSettings
{
    /// <summary>Town.IdTown résolu (clé provisoire possible) — pas de FK.</summary>
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int IdTown { get; set; }

    /// <summary>JSON {"idItem": PA}.</summary>
    [Column("itemValues", TypeName = "longtext")]
    public string ItemValues { get; set; } = null!;

    [Column("version", TypeName = "int(11)")]
    [ConcurrencyCheck]
    public int Version { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    public virtual LastUpdateInfo? IdLastUpdateInfoNavigation { get; set; }
}
