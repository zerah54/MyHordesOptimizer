using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("TownCadaver")]
[Index("CauseOfDeath", Name = "causeOfDeath")]
[Index("CleanUp", Name = "cleanUp")]
[Index("IdCitizen", Name = "idCitizen")]
[Index("IdLastUpdateInfo", Name = "idLastUpdateInfo")]
public partial class TownCadaver
{
    [Key]
    [Column("idCadaver", TypeName = "int(11)")]
    public int IdCadaver { get; set; }

    [Column("idCitizen", TypeName = "int(11)")]
    public int? IdCitizen { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [Column("cadaverName")]
    [StringLength(255)]
    public string CadaverName { get; set; }

    [Column("avatar")]
    [StringLength(255)]
    public string Avatar { get; set; }

    [Column("survivalDay", TypeName = "int(11)")]
    public int? SurvivalDay { get; set; }

    [Column("score", TypeName = "int(11)")]
    public int? Score { get; set; }

    [Column("deathMessage", TypeName = "text")]
    public string DeathMessage { get; set; }

    [Column("townMessage", TypeName = "text")]
    public string TownMessage { get; set; }

    [Column("causeOfDeath", TypeName = "int(11)")]
    public int? CauseOfDeath { get; set; }

    [Column("cleanUp", TypeName = "int(11)")]
    public int? CleanUp { get; set; }

    [ForeignKey("CauseOfDeath")]
    [InverseProperty("TownCadavers")]
    public virtual CauseOfDeath CauseOfDeathNavigation { get; set; }

    [ForeignKey("CleanUp")]
    [InverseProperty("TownCadavers")]
    public virtual TownCadaverCleanUp CleanUpNavigation { get; set; }

    [ForeignKey("IdCitizen")]
    [InverseProperty("TownCadavers")]
    public virtual User IdCitizenNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("TownCadavers")]
    public virtual LastUpdateInfo IdLastUpdateInfoNavigation { get; set; }
}
