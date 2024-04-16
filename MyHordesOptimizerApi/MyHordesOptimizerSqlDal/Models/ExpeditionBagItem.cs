using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdExpeditionBag", "IdItem")]
[Table("ExpeditionBagItem")]
[Index("IdItem", Name = "idItem")]
public partial class ExpeditionBagItem
{
    [Key]
    [Column("idExpeditionBag", TypeName = "int(11)")]
    public int IdExpeditionBag { get; set; }

    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int? Count { get; set; }

    [Required]
    [Column("isBroken")]
    public bool? IsBroken { get; set; }

    [ForeignKey("IdExpeditionBag")]
    [InverseProperty("ExpeditionBagItems")]
    public virtual ExpeditionBag IdExpeditionBagNavigation { get; set; } = null!;

    [ForeignKey("IdItem")]
    [InverseProperty("ExpeditionBagItems")]
    public virtual Item IdItemNavigation { get; set; } = null!;
}
