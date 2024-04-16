using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Expedition")]
[Index("IdTown", Name = "Expedition_ibfk_1")]
[Index("IdLastUpdateInfo", Name = "Expedition_ibfk_2")]
public partial class Expedition
{
    [Key]
    [Column("idExpedition", TypeName = "int(11)")]
    public int IdExpedition { get; set; }

    [Column("idTown", TypeName = "int(11)")]
    public int? IdTown { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [Column("day", TypeName = "int(11)")]
    public int? Day { get; set; }

    [Column(TypeName = "int(11)")]
    public int Position { get; set; }

    [Column("state")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? State { get; set; }

    [Column("label")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? Label { get; set; }

    [Column("minPdc", TypeName = "int(11)")]
    public int? MinPdc { get; set; }

    [InverseProperty("IdExpeditionNavigation")]
    public virtual ICollection<ExpeditionPart> ExpeditionParts { get; set; } = new List<ExpeditionPart>();

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("Expeditions")]
    public virtual LastUpdateInfo? IdLastUpdateInfoNavigation { get; set; }

    [ForeignKey("IdTown")]
    [InverseProperty("Expeditions")]
    public virtual Town? IdTownNavigation { get; set; }
}
