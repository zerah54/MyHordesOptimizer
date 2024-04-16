using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Recipe")]
public partial class Recipe
{
    [Key]
    [Column("name")]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string Name { get; set; } = null!;

    [Column("action_fr")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? ActionFr { get; set; }

    [Column("action_en")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? ActionEn { get; set; }

    [Column("action_de")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? ActionDe { get; set; }

    [Column("action_es")]
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

    [InverseProperty("RecipeNameNavigation")]
    public virtual ICollection<RecipeItemComponent> RecipeItemComponents { get; set; } = new List<RecipeItemComponent>();

    [InverseProperty("RecipeNameNavigation")]
    public virtual ICollection<RecipeItemResult> RecipeItemResults { get; set; } = new List<RecipeItemResult>();
}
