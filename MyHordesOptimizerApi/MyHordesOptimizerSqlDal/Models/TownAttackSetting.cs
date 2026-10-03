using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>Réglages de l'attaque d'un jour, partagés par la ville. Null = valeur par défaut.</summary>
[PrimaryKey("IdTown", "Day")]
[Table("TownAttackSetting")]
public partial class TownAttackSetting
{
    /// <summary>Town.IdTown résolu via ResolveTownId (clé provisoire -mapId possible, migrée par MigrateTownId).</summary>
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    /// <summary>Jour attaqué.</summary>
    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    [Column("souls", TypeName = "int(11)")]
    public int? Souls { get; set; }

    [Column("spaLevel", TypeName = "int(11)")]
    public int? SpaLevel { get; set; }

    [Column("fireworks")]
    public bool Fireworks { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }
}
