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
    public string LabelFr { get; set; }

    [Column("label_en")]
    [StringLength(255)]
    public string LabelEn { get; set; }

    [Column("label_es")]
    [StringLength(255)]
    public string LabelEs { get; set; }

    [Column("label_de")]
    [StringLength(255)]
    public string LabelDe { get; set; }

    [Column("description_fr")]
    [StringLength(1000)]
    public string DescriptionFr { get; set; }

    [Column("description_en")]
    [StringLength(1000)]
    public string DescriptionEn { get; set; }

    [Column("description_es")]
    [StringLength(1000)]
    public string DescriptionEs { get; set; }

    [Column("description_de")]
    [StringLength(1000)]
    public string DescriptionDe { get; set; }

    [Column("explorable", TypeName = "bit(1)")]
    public ulong? Explorable { get; set; }

    [Column("img")]
    [StringLength(255)]
    public string Img { get; set; }

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

    [InverseProperty("IdRuinNavigation")]
    public virtual ICollection<MapCell> MapCells { get; set; } = new List<MapCell>();

    [InverseProperty("IdRuinNavigation")]
    public virtual ICollection<RuinItemDrop> RuinItemDrops { get; set; } = new List<RuinItemDrop>();
}
