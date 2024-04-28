using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("CauseOfDeath")]
public partial class CauseOfDeath
{
    [Key]
    [Column("dtype", TypeName = "int(11)")]
    public int Dtype { get; set; }

    [Column("ref")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? Ref { get; set; }

    [Column("description_fr", TypeName = "text")]
    public string? DescriptionFr { get; set; }

    [Column("description_en", TypeName = "text")]
    public string? DescriptionEn { get; set; }

    [Column("description_es", TypeName = "text")]
    public string? DescriptionEs { get; set; }

    [Column("description_de", TypeName = "text")]
    public string? DescriptionDe { get; set; }

    [Column("icon")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? Icon { get; set; }

    [Column("label_fr", TypeName = "text")]
    public string? LabelFr { get; set; }

    [Column("label_en", TypeName = "text")]
    public string? LabelEn { get; set; }

    [Column("label_es", TypeName = "text")]
    public string? LabelEs { get; set; }

    [Column("label_de", TypeName = "text")]
    public string? LabelDe { get; set; }

    [InverseProperty("CauseOfDeathNavigation")]
    public virtual ICollection<TownCadaver> TownCadavers { get; set; } = new List<TownCadaver>();
}
