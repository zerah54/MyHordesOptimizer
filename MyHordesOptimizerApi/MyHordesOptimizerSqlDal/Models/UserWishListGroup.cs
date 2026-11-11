using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models;

/// <summary>Groupe personnel d'un utilisateur dans sa liste de courses (cf. 2026_11_09_wishlist_groups.sql).</summary>
[Table("UserWishListGroup")]
public partial class UserWishListGroup
{
    [Key]
    [Column("idUserWishListGroup", TypeName = "int(11)")]
    public int IdUserWishListGroup { get; set; }

    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    /// <summary>Tableau JSON d'uid d'objets.</summary>
    [Column("itemUids", TypeName = "text")]
    public string ItemUids { get; set; } = null!;

    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}
