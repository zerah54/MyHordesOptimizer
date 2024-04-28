using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("RecipeName", "IdItem")]
[Table("RecipeItemComponent")]
[Index("IdItem", Name = "idItem")]
public partial class RecipeItemComponent
{
    [Key]
    [Column("recipeName")]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string RecipeName { get; set; } = null!;

    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int? Count { get; set; }

    [ForeignKey("IdItem")]
    [InverseProperty("RecipeItemComponents")]
    public virtual Item IdItemNavigation { get; set; } = null!;

    [ForeignKey("RecipeName")]
    [InverseProperty("RecipeItemComponents")]
    public virtual Recipe RecipeNameNavigation { get; set; } = null!;
}
