using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdBag", "IdItem")]
[Table("BagItem")]
[Index("IdItem", Name = "idItem")]
public partial class BagItem
{
    [Key]
    [Column("idBag", TypeName = "int(11)")]
    public int IdBag { get; set; }

    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int? Count { get; set; }

    [Required]
    [Column("isBroken")]
    public bool? IsBroken { get; set; }

    [ForeignKey("IdItem")]
    [InverseProperty("BagItems")]
    public virtual Item IdItemNavigation { get; set; } = null!;
}
