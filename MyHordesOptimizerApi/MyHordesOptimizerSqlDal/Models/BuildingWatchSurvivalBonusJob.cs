using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdBuilding", "JobUid")]
[Index("JobUid", Name = "jobUID")]
public partial class BuildingWatchSurvivalBonusJob
{
    [Key]
    [Column("idBuilding", TypeName = "int(11)")]
    public int IdBuilding { get; set; }

    [Key]
    [Column("jobUID")]
    [StringLength(30)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string JobUid { get; set; } = null!;

    [Column("watchSurvivalBonus", TypeName = "int(11)")]
    public int WatchSurvivalBonus { get; set; }

    [ForeignKey("IdBuilding")]
    [InverseProperty("BuildingWatchSurvivalBonusJobs")]
    public virtual Building IdBuildingNavigation { get; set; } = null!;

    [ForeignKey("JobUid")]
    [InverseProperty("BuildingWatchSurvivalBonusJobs")]
    public virtual Job JobU { get; set; } = null!;
}
