using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("ExpeditionCitizen")]
[Index("IdExpeditionBag", Name = "idExpeditionBag")]
[Index("IdExpeditionPart", Name = "idExpeditionPart")]
[Index("IdUser", Name = "idUser")]
[Index("PreinscritHeroic", Name = "preinscritHeroic")]
public partial class ExpeditionCitizen
{
    [Key]
    [Column("idExpeditionCitizen", TypeName = "int(11)")]
    public int IdExpeditionCitizen { get; set; }

    [Column("idExpeditionPart", TypeName = "int(11)")]
    public int? IdExpeditionPart { get; set; }

    [Column("idUser", TypeName = "int(11)")]
    public int? IdUser { get; set; }

    [Column("idExpeditionBag", TypeName = "int(11)")]
    public int? IdExpeditionBag { get; set; }

    [Column("isPreinscrit")]
    public bool IsPreinscrit { get; set; }

    [Column("preinscritJob")]
    [StringLength(255)]
    public string? PreinscritJob { get; set; }

    [Column("preinscritHeroic")]
    public string? PreinscritHeroic { get; set; }

    [Column("pdc", TypeName = "int(11)")]
    public int? Pdc { get; set; }

    [Column("isThirsty")]
    public bool? IsThirsty { get; set; }

    [ForeignKey("IdExpeditionBag")]
    [InverseProperty("ExpeditionCitizens")]
    public virtual ExpeditionBag? IdExpeditionBagNavigation { get; set; }

    [ForeignKey("IdExpeditionPart")]
    [InverseProperty("ExpeditionCitizens")]
    public virtual ExpeditionPart? IdExpeditionPartNavigation { get; set; }

    [ForeignKey("IdUser")]
    [InverseProperty("ExpeditionCitizens")]
    public virtual User? IdUserNavigation { get; set; }

    [ForeignKey("PreinscritHeroic")]
    [InverseProperty("ExpeditionCitizens")]
    public virtual HeroSkill? PreinscritHeroicNavigation { get; set; }

    [ForeignKey("IdExpeditionCitizen")]
    [InverseProperty("IdExpeditionCitizens")]
    public virtual ICollection<ExpeditionOrder> IdExpeditionOrders { get; set; } = new List<ExpeditionOrder>();
}
