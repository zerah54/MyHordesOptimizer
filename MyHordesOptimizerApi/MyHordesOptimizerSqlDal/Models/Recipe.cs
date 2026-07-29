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
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string Name { get; set; } = null!;

    [Column("action_fr")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? ActionFr { get; set; }

    [Column("action_en")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? ActionEn { get; set; }

    [Column("action_de")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? ActionDe { get; set; }

    [Column("action_es")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? ActionEs { get; set; }

    [Column("type")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? Type { get; set; }

    /// <summary>
    /// Message d'erreur forcé repris des fixtures MyHordes. Une recette qui en porte un
    /// n'assemble jamais rien : le jeu se contente d'afficher le message. Elle ne doit donc
    /// pas être exposée aux clients.
    /// </summary>
    [Column("forcedErrorMessage")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? ForcedErrorMessage { get; set; }

    [Column("pictoUid")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? PictoUid { get; set; }

    [Column("stealthy")]
    public bool? Stealthy { get; set; }

    [Column("provokingItemId", TypeName = "int(11)")]
    public int? ProvokingItemId { get; set; }

    [ForeignKey("ProvokingItemId")]
    public virtual Item? ProvokingItemNavigation { get; set; }

    [InverseProperty("RecipeNameNavigation")]
    public virtual ICollection<RecipeItemComponent> RecipeItemComponents { get; set; } = new List<RecipeItemComponent>();

    [InverseProperty("RecipeNameNavigation")]
    public virtual ICollection<RecipeItemResult> RecipeItemResults { get; set; } = new List<RecipeItemResult>();
}
