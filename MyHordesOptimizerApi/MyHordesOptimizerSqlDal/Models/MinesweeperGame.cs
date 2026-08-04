using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("MinesweeperGame")]
[Index("IdUser", "Mode", "SizeId", "ChallengeDate", Name = "idx_minesweepergame_daily")]
[Index("SizeId", "Mode", "Status", "ElapsedMs", Name = "idx_minesweepergame_leaderboard")]
public partial class MinesweeperGame
{
    [Key]
    [Column("idMinesweeperGame", TypeName = "int(11)")]
    public int IdMinesweeperGame { get; set; }

    [Column("idUser", TypeName = "int(11)")]
    public int? IdUser { get; set; }

    [Column("sizeId")]
    [StringLength(20)]
    public string SizeId { get; set; } = null!;

    [Column("width", TypeName = "int(11)")]
    public int Width { get; set; }

    [Column("height", TypeName = "int(11)")]
    public int Height { get; set; }

    [Column("mineCount", TypeName = "int(11)")]
    public int MineCount { get; set; }

    [Column("mode")]
    [StringLength(20)]
    public string Mode { get; set; } = null!;

    [Column("challengeDate")]
    public DateOnly? ChallengeDate { get; set; }

    [Column("seed", TypeName = "bigint")]
    public long Seed { get; set; }

    [Column("firstClickX", TypeName = "int(11)")]
    public int FirstClickX { get; set; }

    [Column("firstClickY", TypeName = "int(11)")]
    public int FirstClickY { get; set; }

    [Column("createdAt", TypeName = "datetime")]
    public DateTime CreatedAt { get; set; }

    [Column("startedAt", TypeName = "datetime")]
    public DateTime? StartedAt { get; set; }

    [Column("endedAt", TypeName = "datetime")]
    public DateTime? EndedAt { get; set; }

    [Column("status")]
    [StringLength(20)]
    public string Status { get; set; } = null!;

    [Column("elapsedMs", TypeName = "int(11)")]
    public int? ElapsedMs { get; set; }

    [ForeignKey("IdUser")]
    [InverseProperty("MinesweeperGames")]
    public virtual User? IdUserNavigation { get; set; }
}
