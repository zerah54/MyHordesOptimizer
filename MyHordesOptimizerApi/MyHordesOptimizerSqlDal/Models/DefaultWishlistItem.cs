using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdDefaultWishlist", "IdItem")]
[Table("DefaultWishlistItem")]
[Index("IdItem", Name = "idItem")]
public partial class DefaultWishlistItem
{
    [Key]
    [Column("idDefaultWishlist", TypeName = "int(11)")]
    public int IdDefaultWishlist { get; set; }

    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Column("idUserAuthor", TypeName = "int(11)")]
    public int? IdUserAuthor { get; set; }

    [Column("name")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string Name { get; set; } = null!;

    [Column("label_fr")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? LabelFr { get; set; }

    [Column("label_en")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? LabelEn { get; set; }

    [Column("label_es")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? LabelEs { get; set; }

    [Column("label_de")]
    [StringLength(255)]
    [MySqlCharSet("utf8")]
    [MySqlCollation("utf8_general_ci")]
    public string? LabelDe { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int? Count { get; set; }

    [Column("priority", TypeName = "int(11)")]
    public int? Priority { get; set; }

    [Column("depot")]
    public bool? Depot { get; set; }

    [Column("shouldSignal")]
    public bool? ShouldSignal { get; set; }

    [Column("zoneXPa", TypeName = "int(11)")]
    public int? ZoneXpa { get; set; }

    [ForeignKey("IdItem")]
    [InverseProperty("DefaultWishlistItems")]
    public virtual Item IdItemNavigation { get; set; } = null!;
}
