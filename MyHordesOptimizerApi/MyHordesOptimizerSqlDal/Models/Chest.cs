using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Chest")]
[Index("IdLastUpdateInfo", Name = "ChestItem_fk_lastupdate")]
public partial class Chest
{
    [Key]
    [Column("idChest", TypeName = "int(11)")]
    public int IdChest { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [InverseProperty("IdChestNavigation")]
    public virtual ICollection<ChestItem> ChestItems { get; set; } = new List<ChestItem>();

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("Chests")]
    public virtual LastUpdateInfo? IdLastUpdateInfoNavigation { get; set; }

    [InverseProperty("IdChestNavigation")]
    public virtual ICollection<TownCitizen> TownCitizens { get; set; } = new List<TownCitizen>();
}
