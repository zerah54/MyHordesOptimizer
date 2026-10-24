using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("ExpeditionOrder")]
[Index("IdExpeditionCitizen", Name = "expedition_order_fk_citizen")]
public partial class ExpeditionOrder
{
    [Key]
    [Column("idExpeditionOrder", TypeName = "int(11)")]
    public int IdExpeditionOrder { get; set; }

    [Column("type")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? Type { get; set; }

    [Column("text")]
    public string? Text { get; set; }

    [Column("position", TypeName = "int(11)")]
    public int Position { get; set; }

    [Column("isDone")]
    public bool? IsDone { get; set; }

    [Column("idExpeditionCitizen", TypeName = "int(11)")]
    public int? IdExpeditionCitizen { get; set; }

    /// <summary>Case visée, en coordonnées absolues (comme MapCell.X) ; null avec Y pour une consigne générale.</summary>
    [Column("x", TypeName = "int(11)")]
    public int? X { get; set; }

    [Column("y", TypeName = "int(11)")]
    public int? Y { get; set; }

    /// <summary>Consigne typée (cf. ExpeditionOrderKinds) ; null pour un texte libre.</summary>
    [Column("kind")]
    [StringLength(16)]
    public string? Kind { get; set; }

    /// <summary>Objet à ramasser, déposer ou consommer (FK Item ON DELETE SET NULL).</summary>
    [Column("idItem", TypeName = "int(11)")]
    public int? IdItem { get; set; }

    /// <summary>Nombre d'objets (ramasser, déposer) ou de tas (déblayer).</summary>
    [Column("quantity", TypeName = "int(11)")]
    public int? Quantity { get; set; }

    /// <summary>Action héroïque, clé de la liste du site (secondwind, hero_generic_rescue…).</summary>
    [Column("heroSkill")]
    [StringLength(255)]
    public string? HeroSkill { get; set; }

    /// <summary>Citoyen à attendre (FK Users ON DELETE SET NULL) ; null avec « wait » : le groupe.</summary>
    [Column("idTargetUser", TypeName = "int(11)")]
    public int? IdTargetUser { get; set; }

    /// <summary>Autre expédition du jour à attendre (FK Expedition ON DELETE SET NULL), à la place d'un citoyen.</summary>
    [Column("idTargetExpedition", TypeName = "int(11)")]
    public int? IdTargetExpedition { get; set; }

    /// <summary>Précision libre d'une consigne typée, en texte brut.</summary>
    [Column("note")]
    [StringLength(255)]
    public string? Note { get; set; }

    [ForeignKey("IdExpeditionCitizen")]
    [InverseProperty("ExpeditionOrders")]
    public virtual ExpeditionCitizen? IdExpeditionCitizenNavigation { get; set; }

    [ForeignKey("IdExpeditionOrder")]
    [InverseProperty("IdExpeditionOrders")]
    public virtual ICollection<ExpeditionPart> IdExpeditionParts { get; set; } = new List<ExpeditionPart>();
}
