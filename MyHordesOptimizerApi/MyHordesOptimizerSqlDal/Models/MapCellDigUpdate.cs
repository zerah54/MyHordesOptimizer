using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdTown", "Day")]
[Table("MapCellDigUpdate")]
public partial class MapCellDigUpdate
{
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Key]
    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    [Column("directionRegen", TypeName = "int(11)")]
    public int? DirectionRegen { get; set; }

    [Column("levelRegen", TypeName = "int(11)")]
    public int? LevelRegen { get; set; }

    [Column("tauxRegen", TypeName = "int(11)")]
    public int? TauxRegen { get; set; }

    [ForeignKey("IdTown")]
    [InverseProperty("MapCellDigUpdates")]
    public virtual Town IdTownNavigation { get; set; } = null!;
}
