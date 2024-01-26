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
    [Column("isBroken", TypeName = "bit(1)")]
    public ulong IsBroken { get; set; }

    [ForeignKey("IdCell")]
    [InverseProperty("MapCellItems")]
    public virtual MapCell IdCellNavigation { get; set; }

    [ForeignKey("IdItem")]
    [InverseProperty("MapCellItems")]
    public virtual Item IdItemNavigation { get; set; }
}
