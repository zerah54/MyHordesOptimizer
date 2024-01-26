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
    public string Name { get; set; }

    [Column("action_fr")]
    [StringLength(255)]
    public string ActionFr { get; set; }

    [Column("action_en")]
    [StringLength(255)]
    public string ActionEn { get; set; }

    [Column("action_de")]
    [StringLength(255)]
    public string ActionDe { get; set; }

    [Column("action_es")]
    [StringLength(255)]
    public string ActionEs { get; set; }

    [Column("type")]
    [StringLength(255)]
    public string Type { get; set; }

    [Column("pictoUid")]
    [StringLength(255)]
    public string PictoUid { get; set; }

    [Column("stealthy", TypeName = "bit(1)")]
    public ulong? Stealthy { get; set; }

    [InverseProperty("RecipeNameNavigation")]
    public virtual ICollection<RecipeItemComponent> RecipeItemComponents { get; set; } = new List<RecipeItemComponent>();

    [InverseProperty("RecipeNameNavigation")]
    public virtual ICollection<RecipeItemResult> RecipeItemResults { get; set; } = new List<RecipeItemResult>();
}
