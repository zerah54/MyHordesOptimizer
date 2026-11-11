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

    [Column("shouldSignal")]
    public bool? ShouldSignal { get; set; }

    /// <summary>Uid du TownWishListGroup de la ville auquel la ligne est rattachée, null si hors groupe.</summary>
    [Column("groupUid")]
    [MaxLength(36)]
    public string? GroupUid { get; set; }

    [ForeignKey("IdItem")]
    [InverseProperty("TownWishListItems")]
    public virtual Item IdItemNavigation { get; set; } = null!;

    [ForeignKey("IdTown")]
    [InverseProperty("TownWishListItems")]
    public virtual Town IdTownNavigation { get; set; } = null!;
}
