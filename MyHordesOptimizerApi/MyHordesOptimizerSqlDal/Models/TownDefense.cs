using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models;

/// <summary>Défense de la ville telle que rapportée par city.defense (cf. 2026_10_13_town_building.sql).</summary>
[Table("TownDefense")]
public partial class TownDefense
{
    /// <summary>Town.IdTown résolu (clé provisoire -mapId possible, migrée par MigrateTownId) — pas de FK.</summary>
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int IdTown { get; set; }

    [Column("total", TypeName = "int(11)")] public int? Total { get; set; }
    [Column("base", TypeName = "int(11)")] public int? Base { get; set; }
    [Column("buildings", TypeName = "int(11)")] public int? Buildings { get; set; }
    [Column("upgrades", TypeName = "int(11)")] public int? Upgrades { get; set; }
    [Column("items", TypeName = "int(11)")] public int? Items { get; set; }
    [Column("itemsMul")] public double? ItemsMul { get; set; }
    [Column("citizenHomes", TypeName = "int(11)")] public int? CitizenHomes { get; set; }
    [Column("citizenGuardians", TypeName = "int(11)")] public int? CitizenGuardians { get; set; }
    [Column("watchmen", TypeName = "int(11)")] public int? Watchmen { get; set; }
    [Column("souls", TypeName = "int(11)")] public int? Souls { get; set; }
    [Column("temp", TypeName = "int(11)")] public int? Temp { get; set; }
    [Column("cadavers", TypeName = "int(11)")] public int? Cadavers { get; set; }
    [Column("bonus")] public double? Bonus { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }
}
