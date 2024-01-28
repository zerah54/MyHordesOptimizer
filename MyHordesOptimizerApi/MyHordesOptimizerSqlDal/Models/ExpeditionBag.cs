using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("ExpeditionBag")]
[Index("IdItem", Name = "idItem")]
public partial class ExpeditionBag
{
    [Key]
    [Column("idExpeditionBag", TypeName = "int(11)")]
    public int IdExpeditionBag { get; set; }

    [Column("idItem", TypeName = "int(11)")]
    public int? IdItem { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int? Count { get; set; }

    [Column("isBroken")]
    public bool? IsBroken { get; set; }

    [InverseProperty("IdExpeditionBagNavigation")]
    public virtual ICollection<ExpeditionCitizen> ExpeditionCitizens { get; set; } = new List<ExpeditionCitizen>();

    [ForeignKey("IdItem")]
    [InverseProperty("ExpeditionBags")]
    public virtual Item? IdItemNavigation { get; set; }
}
