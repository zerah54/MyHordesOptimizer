using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Bag")]
[Index("IdLastUpdateInfo", Name = "BagItem_fk_lastupdate")]
public partial class Bag
{
    [Key]
    [Column("idBag", TypeName = "int(11)")]
    public int IdBag { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [InverseProperty("IdBagNavigation")]
    public virtual ICollection<BagItem> BagItems { get; set; } = new List<BagItem>();

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("Bags")]
    public virtual LastUpdateInfo? IdLastUpdateInfoNavigation { get; set; }

    [InverseProperty("IdBagNavigation")]
    public virtual ICollection<TownCitizen> TownCitizens { get; set; } = new List<TownCitizen>();
}
