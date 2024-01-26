using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdTown", "IdItem", "ZoneXpa")]
[Table("TownWishListItem")]
[Index("IdItem", Name = "idItem")]
public partial class TownWishListItem
{
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Column("priority", TypeName = "int(11)")]
    public int? Priority { get; set; }

    [Key]
    [Column("zoneXPa", TypeName = "int(11)")]
    public int ZoneXpa { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int? Count { get; set; }

    [Column("depot", TypeName = "int(11)")]
    public int? Depot { get; set; }

    [Column("shouldSignal", TypeName = "bit(1)")]
    public ulong? ShouldSignal { get; set; }

    [ForeignKey("IdItem")]
    [InverseProperty("TownWishListItems")]
    public virtual Item IdItemNavigation { get; set; }

    [ForeignKey("IdTown")]
    [InverseProperty("TownWishListItems")]
    public virtual Town IdTownNavigation { get; set; }
}
