using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Category")]
public partial class Category
{
    [Key]
    [Column("idCategory", TypeName = "int(11)")]
    public int IdCategory { get; set; }

    [Required]
    [Column("name")]
    [StringLength(255)]
    public string Name { get; set; }

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

    [Column("ordering", TypeName = "int(11)")]
    public int? Ordering { get; set; }

    [InverseProperty("IdCategoryNavigation")]
    public virtual ICollection<Item> Items { get; set; } = new List<Item>();
}
