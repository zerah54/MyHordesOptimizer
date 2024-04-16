using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("ExpeditionBag")]
public partial class ExpeditionBag
{
    [Key]
    [Column("idExpeditionBag", TypeName = "int(11)")]
    public int IdExpeditionBag { get; set; }

    [InverseProperty("IdExpeditionBagNavigation")]
    public virtual ICollection<ExpeditionBagItem> ExpeditionBagItems { get; set; } = new List<ExpeditionBagItem>();

    [InverseProperty("IdExpeditionBagNavigation")]
    public virtual ICollection<ExpeditionCitizen> ExpeditionCitizens { get; set; } = new List<ExpeditionCitizen>();
}
