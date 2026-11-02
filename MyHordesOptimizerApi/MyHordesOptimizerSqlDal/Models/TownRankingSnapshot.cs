using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models;

/// <summary>
/// Réponse brute de /json/towns pour une ville suspecte, capturée avant la migration des clés.
/// Clé = identifiant de classement (<c>rankingId</c>, pas <c>idTown</c> : la table ne suit pas le re-clé).
/// </summary>
[Table("TownRankingSnapshot")]
public partial class TownRankingSnapshot
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("rankingId", TypeName = "int(11)")]
    public int RankingId { get; set; }

    [Column("mapId", TypeName = "int(11)")]
    public int? MapId { get; set; }

    [Column("phaseLabel")]
    [StringLength(16)]
    public string? PhaseLabel { get; set; }

    [Column("season", TypeName = "int(11)")]
    public int? Season { get; set; }

    [Column("language", TypeName = "nvarchar(10)")]
    public string? Language { get; set; }

    [Column("name", TypeName = "nvarchar(255)")]
    public string? Name { get; set; }

    [Column("day", TypeName = "int(11)")]
    public int? Day { get; set; }

    [Column("score", TypeName = "int(11)")]
    public int? Score { get; set; }

    [Column("suspectClass")]
    [StringLength(8)]
    public string SuspectClass { get; set; } = null!;

    /// <summary>Ville demandée à MyHordes et non renvoyée : les autres colonnes restent nulles.</summary>
    [Column("isAbsent")]
    public bool IsAbsent { get; set; }

    [Column("capturedAt", TypeName = "datetime")]
    public DateTime CapturedAt { get; set; }
}
