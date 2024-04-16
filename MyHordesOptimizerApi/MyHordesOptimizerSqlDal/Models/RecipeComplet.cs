using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Keyless]
public partial class RecipeComplet
{
    [Column("recipeName")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string RecipeName { get; set; } = null!;

    [Column("actionFr")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? ActionFr { get; set; }

    [Column("actionEn")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? ActionEn { get; set; }

    [Column("actionDe")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? ActionDe { get; set; }

    [Column("actionEs")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? ActionEs { get; set; }

    [Column("type")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? Type { get; set; }

    [Column("pictoUid")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? PictoUid { get; set; }

    [Column("stealthy")]
    public bool? Stealthy { get; set; }

    [Column("componentItemId", TypeName = "int(11)")]
    public int? ComponentItemId { get; set; }

    [Column("componentCount", TypeName = "int(11)")]
    public int? ComponentCount { get; set; }

    [Column("resultItemId", TypeName = "int(11)")]
    public int? ResultItemId { get; set; }

    [Column("resultProbability")]
    public float? ResultProbability { get; set; }

    [Column("resultWeight", TypeName = "int(11)")]
    public int? ResultWeight { get; set; }
}
