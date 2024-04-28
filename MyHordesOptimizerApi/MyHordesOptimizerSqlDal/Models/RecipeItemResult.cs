using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("RecipeName", "IdItem", "Probability")]
[Table("RecipeItemResult")]
[Index("IdItem", Name = "idItem")]
public partial class RecipeItemResult
{
    [Key]
    [Column("recipeName")]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string RecipeName { get; set; } = null!;

    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Column("weight", TypeName = "int(11)")]
    public int? Weight { get; set; }

    [Key]
    [Column("probability")]
    public float Probability { get; set; }

    [ForeignKey("IdItem")]
    [InverseProperty("RecipeItemResults")]
    public virtual Item IdItemNavigation { get; set; } = null!;

    [ForeignKey("RecipeName")]
    [InverseProperty("RecipeItemResults")]
    public virtual Recipe RecipeNameNavigation { get; set; } = null!;
}
