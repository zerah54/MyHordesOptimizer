using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>État d'un chantier dans une ville (cf. 2026_10_13_town_building.sql).</summary>
[Table("TownBuilding")]
[PrimaryKey(nameof(IdTown), nameof(IdBuilding))]
[Index("IdTown", Name = "TownBuilding_idTown")]
public partial class TownBuilding
{
    /// <summary>Town.IdTown résolu (clé provisoire -mapId possible, migrée par MigrateTownId) — pas de FK.</summary>
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("idBuilding", TypeName = "int(11)")]
    public int IdBuilding { get; set; }

    [Column("isBuilt")]
    public bool IsBuilt { get; set; }

    /// <summary>Coût en PA ajusté à la rareté de la ville.</summary>
    [Column("paCurrent", TypeName = "int(11)")]
    public int? PaCurrent { get; set; }

    /// <summary>PA restants bruts (paCurrent - investis), sans réduction d'atelier.</summary>
    [Column("apRemaining", TypeName = "int(11)")]
    public int? ApRemaining { get; set; }

    [Column("life", TypeName = "int(11)")]
    public int? Life { get; set; }

    [Column("maxLife", TypeName = "int(11)")]
    public int? MaxLife { get; set; }

    [Column("def", TypeName = "int(11)")]
    public int? Def { get; set; }

    [Column("level", TypeName = "int(11)")]
    public int? Level { get; set; }

    [Column("difficulty", TypeName = "int(11)")]
    public int? Difficulty { get; set; }

    /// <summary>JSON [{"itemId":int,"count":int}] des ressources réelles dans la ville.</summary>
    [Column("resourcesCurrent", TypeName = "longtext")]
    public string? ResourcesCurrent { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }
}
