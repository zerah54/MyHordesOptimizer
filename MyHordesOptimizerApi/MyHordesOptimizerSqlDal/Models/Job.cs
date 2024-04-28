using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

public partial class Job
{
    [Key]
    [Column("jobUID")]
    [StringLength(30)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string JobUid { get; set; } = null!;

    [Column("baseWatchSurvival", TypeName = "int(11)")]
    public int BaseWatchSurvival { get; set; }

    [InverseProperty("JobU")]
    public virtual ICollection<BuildingWatchSurvivalBonusJob> BuildingWatchSurvivalBonusJobs { get; set; } = new List<BuildingWatchSurvivalBonusJob>();
}
