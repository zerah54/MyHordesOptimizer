using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdCell", "IdItem", "IsBroken")]
[Table("MapCellItem")]
[Index("IdItem", Name = "idItem")]
public partial class MapCellItem
{
    [Key]
    [Column("idCell", TypeName = "int(11)")]
    public int IdCell { get; set; }

    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int? Count { get; set; }

    [Key]
    [Column("isBroken")]
    public bool? IsBroken { get; set; }

    [ForeignKey("IdCell")]
    [InverseProperty("MapCellItems")]
    public virtual MapCell IdCellNavigation { get; set; } = null!;

    [ForeignKey("IdItem")]
    [InverseProperty("MapCellItems")]
    public virtual Item IdItemNavigation { get; set; } = null!;
}
