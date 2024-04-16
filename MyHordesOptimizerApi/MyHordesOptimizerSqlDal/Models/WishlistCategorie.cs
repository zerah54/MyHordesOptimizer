using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("WishlistCategorie")]
[Index("IdUserAuthor", Name = "idUserAuthor")]
public partial class WishlistCategorie
{
    [Key]
    [Column("idCategory", TypeName = "int(11)")]
    public int IdCategory { get; set; }

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

    [ForeignKey("IdUserAuthor")]
    [InverseProperty("WishlistCategories")]
    public virtual User? IdUserAuthorNavigation { get; set; }

    [ForeignKey("IdCategory")]
    [InverseProperty("IdCategories")]
    public virtual ICollection<Item> IdItems { get; set; } = new List<Item>();
}
