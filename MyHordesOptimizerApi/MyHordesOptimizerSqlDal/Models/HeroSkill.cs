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
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
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
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
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

    [Column("legacy")]
    public bool? Legacy { get; set; }

    [Column("groupSort", TypeName = "int(11)")]
    public int? GroupSort { get; set; }

    [Column("level", TypeName = "int(11)")]
    public int? Level { get; set; }

    [Column("group_fr", TypeName = "text")]
    public string? GroupFr { get; set; }

    [Column("group_en", TypeName = "text")]
    public string? GroupEn { get; set; }

    [Column("group_es", TypeName = "text")]
    public string? GroupEs { get; set; }

    [Column("group_de", TypeName = "text")]
    public string? GroupDe { get; set; }

    /// <summary>Avantages du niveau traduits, en tableau JSON (cf. HeroSkillBullets côté API).</summary>
    [Column("bullets_fr", TypeName = "text")]
    public string? BulletsFr { get; set; }

    [Column("bullets_en", TypeName = "text")]
    public string? BulletsEn { get; set; }

    [Column("bullets_es", TypeName = "text")]
    public string? BulletsEs { get; set; }

    [Column("bullets_de", TypeName = "text")]
    public string? BulletsDe { get; set; }

    [InverseProperty("PreinscritHeroicNavigation")]
    public virtual ICollection<ExpeditionCitizen> ExpeditionCitizens { get; set; } = new List<ExpeditionCitizen>();
}
