using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdBuilding", "IdItem", "ResourceTier")]
[Index("IdItem", Name = "idItem")]
public partial class BuildingRessource
{
    [Key]
    [Column("idBuilding", TypeName = "int(11)")]
    public int IdBuilding { get; set; }

    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    /// <summary>0 = Default (existant), 1 = Hard (tier0), 2 = Easy (tier1 et tier2).</summary>
    [Key]
    [Column("resourceTier")]
    public int ResourceTier { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int Count { get; set; }

    [ForeignKey("IdBuilding")]
    [InverseProperty("BuildingRessources")]
    public virtual Building IdBuildingNavigation { get; set; } = null!;

    [ForeignKey("IdItem")]
    [InverseProperty("BuildingRessources")]
    public virtual Item IdItemNavigation { get; set; } = null!;
}
