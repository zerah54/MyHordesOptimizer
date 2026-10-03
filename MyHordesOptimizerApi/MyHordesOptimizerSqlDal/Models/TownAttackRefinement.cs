using System;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>Affinage d'attaque d'un jour attaqué, partagé par la ville. Les seeds ne quittent jamais le serveur.</summary>
[PrimaryKey("IdTown", "Day")]
[Table("TownAttackRefinement")]
public partial class TownAttackRefinement
{
    /// <summary>Town.IdTown résolu via ResolveTownId (clé provisoire -mapId possible, migrée par MigrateTownId).</summary>
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    /// <summary>Jour attaqué.</summary>
    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    /// <summary>Entrées du scan pour lesquelles les candidats sont complets (JSON RefinementInput).</summary>
    [Column("input", TypeName = "longtext")]
    public string Input { get; set; } = null!;

    /// <summary>Couples (seed, somme, base) compatibles, 6 octets chacun ; null une fois le jour passé.</summary>
    [Column("candidates", TypeName = "longblob")]
    public byte[]? Candidates { get; set; }

    [Column("candidateCount", TypeName = "int(11)")]
    public int CandidateCount { get; set; }

    /// <summary>"Valid" ou "Invalid".</summary>
    [Column("status", TypeName = "varchar(16)")]
    public string Status { get; set; } = null!;

    /// <summary>Données modifiées depuis le dernier calcul : à recalculer à la prochaine lecture.</summary>
    [Column("stale")]
    public bool Stale { get; set; }

    /// <summary>Bornes de la plage AVANT facteur d'âmes à l'attaque (null : aucune configuration compatible).</summary>
    [Column("valueMin", TypeName = "int(11)")]
    public int? ValueMin { get; set; }

    [Column("valueMax", TypeName = "int(11)")]
    public int? ValueMax { get; set; }

    [Column("reductionMin", TypeName = "int(11)")]
    public int? ReductionMin { get; set; }

    [Column("reductionMax", TypeName = "int(11)")]
    public int? ReductionMax { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [Column("computedAt", TypeName = "datetime")]
    public DateTime ComputedAt { get; set; }
}
