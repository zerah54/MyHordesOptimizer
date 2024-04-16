using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Town")]
[Index("IdUserWishListUpdater", Name = "Town_fkuserwishlist")]
public partial class Town
{
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("idUserWishListUpdater", TypeName = "int(11)")]
    public int? IdUserWishListUpdater { get; set; }

    [Column("wishlistDateUpdate", TypeName = "datetime")]
    public DateTime? WishlistDateUpdate { get; set; }

    [Column("x", TypeName = "int(11)")]
    public int X { get; set; }

    [Column("y", TypeName = "int(11)")]
    public int Y { get; set; }

    [Column("width", TypeName = "int(11)")]
    public int Width { get; set; }

    [Column("height", TypeName = "int(11)")]
    public int Height { get; set; }

    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    [Column("waterWell", TypeName = "int(11)")]
    public int WaterWell { get; set; }

    [Column("isDoorOpen")]
    public bool IsDoorOpen { get; set; }

    [Column("isChaos")]
    public bool IsChaos { get; set; }

    [Column("isDevasted")]
    public bool IsDevasted { get; set; }

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<Expedition> Expeditions { get; set; } = new List<Expedition>();

    [ForeignKey("IdUserWishListUpdater")]
    [InverseProperty("Towns")]
    public virtual User? IdUserWishListUpdaterNavigation { get; set; }

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<MapCellDigUpdate> MapCellDigUpdates { get; set; } = new List<MapCellDigUpdate>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<MapCell> MapCells { get; set; } = new List<MapCell>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownBankItem> TownBankItems { get; set; } = new List<TownBankItem>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownCitizenBath> TownCitizenBaths { get; set; } = new List<TownCitizenBath>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownCitizen> TownCitizens { get; set; } = new List<TownCitizen>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownEstimation> TownEstimations { get; set; } = new List<TownEstimation>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownWishListItem> TownWishListItems { get; set; } = new List<TownWishListItem>();
}
