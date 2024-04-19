using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdRuin", "IdBuilding")]
[Table("RuinBlueprint")]
public partial class RuinBlueprint
{
    [Key]
    [Column("idRuin", TypeName = "int(11)")]
    public int IdRuin { get; set; }

    [Key]
    [Column("idBuilding", TypeName = "int(11)")]
    public int IdBuilding { get; set; }

    [ForeignKey("IdRuin")]
    [InverseProperty("RuinBlueprints")]
    public virtual Ruin IdRuinNavigation { get; set; } = null!;
}
