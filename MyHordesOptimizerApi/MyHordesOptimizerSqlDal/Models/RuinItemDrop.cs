using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdRuin", "IdItem")]
[Table("RuinItemDrop")]
[Index("IdItem", Name = "idItem")]
public partial class RuinItemDrop
{
    [Key]
    [Column("idRuin", TypeName = "int(11)")]
    public int IdRuin { get; set; }

    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Column("weight", TypeName = "int(11)")]
    public int? Weight { get; set; }

    [Column("probability")]
    public float? Probability { get; set; }

    [ForeignKey("IdItem")]
    [InverseProperty("RuinItemDrops")]
    public virtual Item IdItemNavigation { get; set; }

    [ForeignKey("IdRuin")]
    [InverseProperty("RuinItemDrops")]
    public virtual Ruin IdRuinNavigation { get; set; }
}
