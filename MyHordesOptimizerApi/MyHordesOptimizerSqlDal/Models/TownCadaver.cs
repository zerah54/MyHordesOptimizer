using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdTown", "IdUser")]
[Table("TownCadaver")]
[Index("IdUser", Name = "TownCadaver_ibfk_1")]
[Index("CauseOfDeath", Name = "causeOfDeath")]
[Index("CleanUp", Name = "cleanUp")]
[Index("IdLastUpdateInfo", Name = "idLastUpdateInfo")]
public partial class TownCadaver
{
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Key]
    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [Column("cadaverName")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? CadaverName { get; set; }

    [Column("avatar")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? Avatar { get; set; }

    [Column("survivalDay", TypeName = "int(11)")]
    public int? SurvivalDay { get; set; }

    [Column("score", TypeName = "int(11)")]
    public int? Score { get; set; }

    [Column("deathMessage", TypeName = "text")]
    public string? DeathMessage { get; set; }

    [Column("townMessage", TypeName = "text")]
    public string? TownMessage { get; set; }

    [Column("causeOfDeath", TypeName = "int(11)")]
    public int? CauseOfDeath { get; set; }

    [Column("cleanUp", TypeName = "int(11)")]
    public int? CleanUp { get; set; }

    [ForeignKey("CauseOfDeath")]
    [InverseProperty("TownCadavers")]
    public virtual CauseOfDeath? CauseOfDeathNavigation { get; set; }

    [ForeignKey("CleanUp")]
    [InverseProperty("TownCadavers")]
    public virtual TownCadaverCleanUp? CleanUpNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("TownCadavers")]
    public virtual LastUpdateInfo? IdLastUpdateInfoNavigation { get; set; }

    [ForeignKey("IdTown")]
    [InverseProperty("TownCadavers")]
    public virtual Town IdTownNavigation { get; set; } = null!;

    [ForeignKey("IdUser")]
    [InverseProperty("TownCadavers")]
    public virtual User IdUserNavigation { get; set; } = null!;
}
