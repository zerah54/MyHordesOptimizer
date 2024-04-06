using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("ExpeditionOrder")]
[Index("IdExpeditionCitizen", Name = "expedition_order_fk_citizen")]
public partial class ExpeditionOrder
{
    [Key]
    [Column("idExpeditionOrder", TypeName = "int(11)")]
    public int IdExpeditionOrder { get; set; }

    [Column("type")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? Type { get; set; }

    [Column("text")]
    public string? Text { get; set; }

    [Column("position", TypeName = "int(11)")]
    public int Position { get; set; }

    [Column("isDone")]
    public bool? IsDone { get; set; }

    [Column("idExpeditionCitizen", TypeName = "int(11)")]
    public int IdExpeditionCitizen { get; set; }

    [ForeignKey("IdExpeditionCitizen")]
    [InverseProperty("ExpeditionOrders")]
    public virtual ExpeditionCitizen IdExpeditionCitizenNavigation { get; set; } = null!;

    [ForeignKey("IdExpeditionOrder")]
    [InverseProperty("IdExpeditionOrders")]
    public virtual ICollection<ExpeditionPart> IdExpeditionParts { get; set; } = new List<ExpeditionPart>();
}
