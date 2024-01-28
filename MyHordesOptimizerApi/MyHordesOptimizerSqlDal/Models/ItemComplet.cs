using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Keyless]
public partial class ItemComplet
{
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Column("idCategory", TypeName = "int(11)")]
    public int? IdCategory { get; set; }

    [Column("itemUid")]
    [StringLength(255)]
    public string? ItemUid { get; set; }

    [Column("itemDeco", TypeName = "int(11)")]
    public int? ItemDeco { get; set; }

    [Column("itemLabel_fr")]
    [StringLength(255)]
    public string? ItemLabelFr { get; set; }

    [Column("itemLabel_en")]
    [StringLength(255)]
    public string? ItemLabelEn { get; set; }

    [Column("itemLabel_es")]
    [StringLength(255)]
    public string? ItemLabelEs { get; set; }

    [Column("itemLabel_de")]
    [StringLength(255)]
    public string? ItemLabelDe { get; set; }

    [Column("itemDescription_fr")]
    [StringLength(1000)]
    public string? ItemDescriptionFr { get; set; }

    [Column("itemDescription_en")]
    [StringLength(1000)]
    public string? ItemDescriptionEn { get; set; }

    [Column("itemDescription_es")]
    [StringLength(1000)]
    public string? ItemDescriptionEs { get; set; }

    [Column("itemDescription_de")]
    [StringLength(1000)]
    public string? ItemDescriptionDe { get; set; }

    [Column("itemGuard", TypeName = "int(11)")]
    public int? ItemGuard { get; set; }

    [Column("itemImg")]
    [StringLength(255)]
    public string? ItemImg { get; set; }

    [Column("itemIsHeaver")]
    public bool? ItemIsHeaver { get; set; }

    [Column("itemDropRate_praf")]
    public float? ItemDropRatePraf { get; set; }

    [Column("itemDropRate_notPraf")]
    public float? ItemDropRateNotPraf { get; set; }

    [Column("catName")]
    [StringLength(255)]
    public string? CatName { get; set; }

    [Column("catOrdering", TypeName = "int(11)")]
    public int? CatOrdering { get; set; }

    [Column("catLabel_fr")]
    [StringLength(255)]
    public string? CatLabelFr { get; set; }

    [Column("catLabel_en")]
    [StringLength(255)]
    public string? CatLabelEn { get; set; }

    [Column("catLabel_es")]
    [StringLength(255)]
    public string? CatLabelEs { get; set; }

    [Column("catLabel_de")]
    [StringLength(255)]
    public string? CatLabelDe { get; set; }

    [Column("actionName")]
    [StringLength(255)]
    public string? ActionName { get; set; }

    [Column("propertyName")]
    [StringLength(255)]
    public string? PropertyName { get; set; }

    [Column("dropRate_praf")]
    public float? DropRatePraf { get; set; }

    [Column("dropRate_notPraf")]
    public float? DropRateNotPraf { get; set; }
}
