using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("ExpeditionPart")]
[Index("IdExpedition", Name = "ExpeditionPart_ibfk_1")]
public partial class ExpeditionPart
{
    [Key]
    [Column("idExpeditionPart", TypeName = "int(11)")]
    public int IdExpeditionPart { get; set; }

    [Column("idExpedition", TypeName = "int(11)")]
    public int? IdExpedition { get; set; }

    [Column(TypeName = "int(11)")]
    public int Position { get; set; }

    [Column("path")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? Path { get; set; }

    [Column("label")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? Label { get; set; }

    [Column("direction")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? Direction { get; set; }

    [InverseProperty("IdExpeditionPartNavigation")]
    public virtual ICollection<ExpeditionCitizen> ExpeditionCitizens { get; set; } = new List<ExpeditionCitizen>();

    [ForeignKey("IdExpedition")]
    [InverseProperty("ExpeditionParts")]
    public virtual Expedition? IdExpeditionNavigation { get; set; }

    [ForeignKey("IdExpeditionPart")]
    [InverseProperty("IdExpeditionParts")]
    public virtual ICollection<ExpeditionOrder> IdExpeditionOrders { get; set; } = new List<ExpeditionOrder>();
}
