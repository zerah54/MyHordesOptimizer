using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>Groupe de la liste de courses d'une ville (cf. 2026_11_09_wishlist_groups.sql).</summary>
[PrimaryKey("IdTown", "Uid")]
[Table("TownWishListGroup")]
public partial class TownWishListGroup
{
    /// <summary>Town.IdTown résolu (clé provisoire -mapId possible, migrée par MigrateTownId) — pas de FK.</summary>
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("uid")]
    [MaxLength(36)]
    public string Uid { get; set; } = null!;

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("priority", TypeName = "int(11)")]
    public int Priority { get; set; }

    [Column("zoneXPa", TypeName = "int(11)")]
    public int ZoneXpa { get; set; }

    [Column("depot", TypeName = "int(11)")]
    public int Depot { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int Count { get; set; }
}
