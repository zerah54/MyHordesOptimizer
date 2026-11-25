using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>Simulation de veille d'une ville (cf. 2026_11_24_town_nightwatch_simulation.sql).</summary>
[Table("TownNightwatchSimulation")]
[Index("IdTown", Name = "TownNightwatchSimulation_idTown")]
public partial class TownNightwatchSimulation
{
    [Key]
    [Column("idTownNightwatchSimulation", TypeName = "int(11)")]
    public int IdTownNightwatchSimulation { get; set; }

    /// <summary>Town.IdTown résolu (clé provisoire -mapId possible, migrée par MigrateTownId) — pas de FK.</summary>
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("name")]
    [StringLength(64)]
    public string Name { get; set; } = null!;

    /// <summary>Dernier jour simulable.</summary>
    [Column("lastDay", TypeName = "int(11)")]
    public int LastDay { get; set; }

    /// <summary>JSON Dictionary&lt;IdItem, quantité&gt;.</summary>
    [Column("stock", TypeName = "longtext")]
    public string Stock { get; set; } = null!;

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
