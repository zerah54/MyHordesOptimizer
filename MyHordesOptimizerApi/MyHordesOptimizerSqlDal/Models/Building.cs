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

    /// <summary>
    /// Identifiant du prototype chez MyHordes, à l'instant de la dernière synchronisation.
    /// MUTABLE et sans valeur d'identité : c'est un auto-incrément de fixtures, qui change
    /// d'une instance du jeu à l'autre. L'identité, c'est <see cref="Uid"/>.
    /// </summary>
    /// <remarks>
    /// ATTENTION : cette valeur DIFFÈRE couramment de <c>IdBuilding</c>, et c'est voulu.
    /// Mesuré le 2026-07-27 : 128 des 166 bâtiments avaient déjà divergé. Ne pas « corriger »
    /// cet écart — c'est précisément ce que ce découplage protège. Les charges de ville
    /// (<c>city.chantiers</c>, <c>city.buildings</c>) ne portent aucun <c>uid</c> : c'est par
    /// cette colonne, et elle seule, qu'on sait de quel bâtiment elles parlent.
    /// </remarks>
    [Column("mhId", TypeName = "int(11)")]
    public int? MhId { get; set; }

    /// <summary>
    /// Rang d'affichage officiel du jeu (<c>BuildingPrototype::getOrderBy</c>).
    /// </summary>
    /// <remarks>
    /// NON UNIQUE, et ce n'est pas un défaut : relevé le 2026-07-28, les 166 bâtiments se répartissent
    /// sur les valeurs 0 à 13, plusieurs partageant la même (Douves, Grand fossé et Muraille rasoir
    /// sont tous à 0). C'est un rang DANS un groupe, pas un ordre total : il doit se combiner à un
    /// autre critère — le parent, ou le nom — pour trier une liste complète.
    /// La colonne ne s'appelle pas <c>order</c> : c'est un mot réservé de SQL.
    /// </remarks>
    [Column("displayOrder", TypeName = "int(11)")]
    public int? DisplayOrder { get; set; }

    /// <summary>
    /// Vrai quand le prototype a disparu du jeu. La ligne est CONSERVÉE pour que les données
    /// qui la référencent restent résolvables ; elle est seulement exclue des catalogues.
    /// </summary>
    [Column("isObsolete")]
    public bool IsObsolete { get; set; }

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
