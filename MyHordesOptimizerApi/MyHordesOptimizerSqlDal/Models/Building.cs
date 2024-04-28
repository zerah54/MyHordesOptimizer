using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Building")]
[Index("IdBuildingParent", Name = "idBuildingParent")]
public partial class Building
{
    [Key]
    [Column("idBuilding", TypeName = "int(11)")]
    public int IdBuilding { get; set; }

    [Column("uid")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string Uid { get; set; } = null!;

    [Column("icone")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? Icone { get; set; }

    [Column("label_fr")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? LabelFr { get; set; }

    [Column("label_en")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? LabelEn { get; set; }

    [Column("label_es")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? LabelEs { get; set; }

    [Column("label_de")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? LabelDe { get; set; }

    [Column("description_fr", TypeName = "text")]
    public string? DescriptionFr { get; set; }

    [Column("description_en", TypeName = "text")]
    public string? DescriptionEn { get; set; }

    [Column("description_es", TypeName = "text")]
    public string? DescriptionEs { get; set; }

    [Column("description_de", TypeName = "text")]
    public string? DescriptionDe { get; set; }

    [Column("nbPaRequired", TypeName = "int(11)")]
    public int NbPaRequired { get; set; }

    [Column("maxLife", TypeName = "int(11)")]
    public int MaxLife { get; set; }

    [Column("breakable")]
    public bool Breakable { get; set; }

    [Column("defence", TypeName = "int(11)")]
    public int Defence { get; set; }

    [Column("hasUpgrade")]
    public bool HasUpgrade { get; set; }

    [Column("rarity", TypeName = "int(11)")]
    public int Rarity { get; set; }

    [Column("temporary")]
    public bool Temporary { get; set; }

    [Column("idBuildingParent", TypeName = "int(11)")]
    public int? IdBuildingParent { get; set; }

    [Column("watchSurvivalBonusUpgradeLevelRequired", TypeName = "int(11)")]
    public int WatchSurvivalBonusUpgradeLevelRequired { get; set; }

    [InverseProperty("IdBuildingNavigation")]
    public virtual ICollection<BuildingRessource> BuildingRessources { get; set; } = new List<BuildingRessource>();

    [InverseProperty("IdBuildingNavigation")]
    public virtual ICollection<BuildingWatchSurvivalBonusJob> BuildingWatchSurvivalBonusJobs { get; set; } = new List<BuildingWatchSurvivalBonusJob>();

    [ForeignKey("IdBuildingParent")]
    [InverseProperty("InverseIdBuildingParentNavigation")]
    public virtual Building? IdBuildingParentNavigation { get; set; }

    [InverseProperty("IdBuildingParentNavigation")]
    public virtual ICollection<Building> InverseIdBuildingParentNavigation { get; set; } = new List<Building>();
}
