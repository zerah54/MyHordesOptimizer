using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("TownCadaverCleanUp")]
public partial class TownCadaverCleanUp
{
    [Key]
    [Column("idCleanUp", TypeName = "int(11)")]
    public int IdCleanUp { get; set; }

    [Column("idCleanUpType", TypeName = "int(11)")]
    public int? IdCleanUpType { get; set; }

    [Column("idUserCleanUp", TypeName = "int(11)")]
    public int? IdUserCleanUp { get; set; }

    [InverseProperty("CleanUpNavigation")]
    public virtual ICollection<TownCadaver> TownCadavers { get; set; } = new List<TownCadaver>();
}
