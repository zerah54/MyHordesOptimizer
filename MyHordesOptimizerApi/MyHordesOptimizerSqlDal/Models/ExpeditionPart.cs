using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("ExpeditionPart")]
[Index("IdExpedition", Name = "ExpeditionPart_ibfk_1")]
[Index("IdMapRoute", Name = "ExpeditionPart_fk_mapRoute")]
public partial class ExpeditionPart
{
    [Key]
    [Column("idExpeditionPart", TypeName = "int(11)")]
    public int IdExpeditionPart { get; set; }

    [Column("idExpedition", TypeName = "int(11)")]
    public int? IdExpedition { get; set; }

    /// <summary>
    /// Tracé lié (FK ON DELETE SET NULL : supprimer le tracé délie la partie, ses consignes restent).
    /// UpdateAllButKeysProperties recopie cette valeur depuis le modèle mappé du DTO : la requête la porte
    /// toujours (MapRouteId), et ExpeditionService contrôle tout changement de lien.
    /// </summary>
    [Column("idMapRoute", TypeName = "int(11)")]
    public int? IdMapRoute { get; set; }

    [Column(TypeName = "int(11)")]
    public int Position { get; set; }

    [Column("label")]
    [StringLength(255)]
    public string? Label { get; set; }

    [Column(TypeName = "int(11)")]
    public int? Direction { get; set; }

    [InverseProperty("IdExpeditionPartNavigation")]
    public virtual ICollection<ExpeditionCitizen> ExpeditionCitizens { get; set; } = new List<ExpeditionCitizen>();

    [ForeignKey("IdExpedition")]
    [InverseProperty("ExpeditionParts")]
    public virtual Expedition? IdExpeditionNavigation { get; set; }

    [ForeignKey("IdMapRoute")]
    [InverseProperty("ExpeditionParts")]
    public virtual MapRoute? IdMapRouteNavigation { get; set; }

    [ForeignKey("IdExpeditionPart")]
    [InverseProperty("IdExpeditionParts")]
    public virtual ICollection<ExpeditionOrder> IdExpeditionOrders { get; set; } = new List<ExpeditionOrder>();
}
