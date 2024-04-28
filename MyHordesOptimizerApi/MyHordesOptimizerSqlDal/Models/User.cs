using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

public partial class User
{
    [Key]
    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Column("name")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string Name { get; set; } = null!;

    [StringLength(255)]
    public string? UserKey { get; set; }

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<ExpeditionCitizen> ExpeditionCitizens { get; set; } = new List<ExpeditionCitizen>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<LastUpdateInfo> LastUpdateInfos { get; set; } = new List<LastUpdateInfo>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<MapCellDig> MapCellDigs { get; set; } = new List<MapCellDig>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<TownCadaver> TownCadavers { get; set; } = new List<TownCadaver>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<TownCitizenBath> TownCitizenBaths { get; set; } = new List<TownCitizenBath>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<TownCitizen> TownCitizens { get; set; } = new List<TownCitizen>();

    [InverseProperty("IdUserWishListUpdaterNavigation")]
    public virtual ICollection<Town> Towns { get; set; } = new List<Town>();

    [InverseProperty("IdUserAuthorNavigation")]
    public virtual ICollection<WishlistCategorie> WishlistCategories { get; set; } = new List<WishlistCategorie>();
}
