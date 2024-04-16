using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Keyless]
public partial class RuinComplete
{
    [Column("idRuin", TypeName = "int(11)")]
    public int IdRuin { get; set; }

    [Column("ruinLabel_fr")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? RuinLabelFr { get; set; }

    [Column("ruinLabel_en")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? RuinLabelEn { get; set; }

    [Column("ruinLabel_es")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? RuinLabelEs { get; set; }

    [Column("ruinLabel_de")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? RuinLabelDe { get; set; }

    [Column("ruinDescription_fr")]
    [StringLength(1000)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? RuinDescriptionFr { get; set; }

    [Column("ruinDescription_en")]
    [StringLength(1000)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? RuinDescriptionEn { get; set; }

    [Column("ruinDescription_es")]
    [StringLength(1000)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? RuinDescriptionEs { get; set; }

    [Column("ruinDescription_de")]
    [StringLength(1000)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? RuinDescriptionDe { get; set; }

    [Column("ruinExplorable")]
    public bool? RuinExplorable { get; set; }

    [Column("ruinImg")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? RuinImg { get; set; }

    [Column("ruinCamping", TypeName = "int(11)")]
    public int? RuinCamping { get; set; }

    [Column("ruinMinDist", TypeName = "int(11)")]
    public int? RuinMinDist { get; set; }

    [Column("ruinMaxDist", TypeName = "int(11)")]
    public int? RuinMaxDist { get; set; }

    [Column("ruinChance", TypeName = "int(11)")]
    public int? RuinChance { get; set; }

    [Column("ruinCapacity", TypeName = "int(11)")]
    public int? RuinCapacity { get; set; }

    [Column("idItem", TypeName = "int(11)")]
    public int? IdItem { get; set; }

    [Column("itemUid")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? ItemUid { get; set; }

    [Column("itemLabel_fr")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? ItemLabelFr { get; set; }

    [Column("dropProbability")]
    public float? DropProbability { get; set; }

    [Column("dropWeight", TypeName = "int(11)")]
    public int? DropWeight { get; set; }
}
