using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Ruin")]
public partial class Ruin
{
    [Key]
    [Column("idRuin", TypeName = "int(11)")]
    public int IdRuin { get; set; }

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

    [Column("description_fr")]
    [StringLength(1000)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? DescriptionFr { get; set; }

    [Column("description_en")]
    [StringLength(1000)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? DescriptionEn { get; set; }

    [Column("description_es")]
    [StringLength(1000)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? DescriptionEs { get; set; }

    [Column("description_de")]
    [StringLength(1000)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? DescriptionDe { get; set; }

    [Column("explorable")]
    public bool? Explorable { get; set; }

    [Column("img")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? Img { get; set; }

    [Column("camping", TypeName = "int(11)")]
    public int? Camping { get; set; }

    [Column("minDist", TypeName = "int(11)")]
    public int? MinDist { get; set; }

    [Column("maxDist", TypeName = "int(11)")]
    public int? MaxDist { get; set; }

    [Column("chance", TypeName = "int(11)")]
    public int? Chance { get; set; }

    [Column("capacity", TypeName = "int(11)")]
    public int? Capacity { get; set; }

    /// <summary>
    /// Identifiant du prototype chez MyHordes, à l'instant de la dernière synchronisation.
    /// MUTABLE et sans valeur d'identité : c'est un auto-incrément de fixtures, qui change
    /// d'une instance du jeu à l'autre. Peut différer de <c>IdRuin</c> — c'est normal et voulu.
    /// </summary>
    /// <remarks>
    /// L'identité d'une ruine est son <c>Img</c>, et c'est la plus faible des quatre :
    /// <c>ZonePrototype</c> n'a pas de champ <c>name</c> et <c>/json/ruins</c> est indexé par
    /// l'identifiant numérique. L'icône ne fait office d'identité que par convention des
    /// fixtures du jeu, vérifiée sur les 65 ruines sans écart.
    /// </remarks>
    [Column("mhId", TypeName = "int(11)")]
    public int? MhId { get; set; }

    /// <summary>
    /// Vrai quand le prototype a disparu du jeu. La ligne est CONSERVÉE pour que les données
    /// qui la référencent restent résolvables ; elle est seulement exclue des catalogues.
    /// </summary>
    [Column("isObsolete")]
    public bool IsObsolete { get; set; }

    [InverseProperty("IdRuinNavigation")]
    public virtual ICollection<MapCell> MapCells { get; set; } = new List<MapCell>();

    [InverseProperty("IdRuinNavigation")]
    public virtual ICollection<RuinBlueprint> RuinBlueprints { get; set; } = new List<RuinBlueprint>();

    [InverseProperty("IdRuinNavigation")]
    public virtual ICollection<RuinItemDrop> RuinItemDrops { get; set; } = new List<RuinItemDrop>();
}
