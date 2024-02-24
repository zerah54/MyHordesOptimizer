using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

public partial class HeroSkill
{
    [Key]
    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("daysNeeded", TypeName = "int(11)")]
    public int? DaysNeeded { get; set; }

    [Column("description_fr", TypeName = "text")]
    public string? DescriptionFr { get; set; }

    [Column("description_en", TypeName = "text")]
    public string? DescriptionEn { get; set; }

    [Column("description_es", TypeName = "text")]
    public string? DescriptionEs { get; set; }

    [Column("description_de", TypeName = "text")]
    public string? DescriptionDe { get; set; }

    [Column("icon")]
    [StringLength(255)]
    public string? Icon { get; set; }

    [Column("label_fr", TypeName = "text")]
    public string? LabelFr { get; set; }

    [Column("label_en", TypeName = "text")]
    public string? LabelEn { get; set; }

    [Column("label_es", TypeName = "text")]
    public string? LabelEs { get; set; }

    [Column("label_de", TypeName = "text")]
    public string? LabelDe { get; set; }

    [Column("nbUses", TypeName = "int(11)")]
    public int? NbUses { get; set; }

    [InverseProperty("PreinscritHeroicNavigation")]
    public virtual ICollection<ExpeditionCitizen> ExpeditionCitizens { get; set; } = new List<ExpeditionCitizen>();
}
