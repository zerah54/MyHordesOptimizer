using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Item")]
[Index("IdCategory", Name = "idCategory")]
public partial class Item
{
    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Column("idCategory", TypeName = "int(11)")]
    public int? IdCategory { get; set; }

    [Column("uid")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? Uid { get; set; }

    [Column("deco", TypeName = "int(11)")]
    public int? Deco { get; set; }

    [Column("label_fr")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? LabelFr { get; set; }

    [Column("label_en")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? LabelEn { get; set; }

    [Column("label_es")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? LabelEs { get; set; }

    [Column("label_de")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? LabelDe { get; set; }

    [Column("description_fr")]
    [StringLength(1000)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? DescriptionFr { get; set; }

    [Column("description_en")]
    [StringLength(1000)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? DescriptionEn { get; set; }

    [Column("description_es")]
    [StringLength(1000)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? DescriptionEs { get; set; }

    [Column("description_de")]
    [StringLength(1000)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? DescriptionDe { get; set; }

    [Column("guard", TypeName = "int(11)")]
    public int? Guard { get; set; }

    [Column("img")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? Img { get; set; }

    [Column("isHeaver")]
    public bool? IsHeaver { get; set; }

    [Column("dropRate_praf")]
    public float? DropRatePraf { get; set; }

    [Column("dropRate_notPraf")]
    public float? DropRateNotPraf { get; set; }

    [InverseProperty("IdItemNavigation")]
    public virtual ICollection<BagItem> BagItems { get; set; } = new List<BagItem>();

    [InverseProperty("IdItemNavigation")]
    public virtual ICollection<BuildingRessource> BuildingRessources { get; set; } = new List<BuildingRessource>();

    [InverseProperty("IdItemNavigation")]
    public virtual ICollection<DefaultWishlistItem> DefaultWishlistItems { get; set; } = new List<DefaultWishlistItem>();

    [InverseProperty("IdItemNavigation")]
    public virtual ICollection<ExpeditionBagItem> ExpeditionBagItems { get; set; } = new List<ExpeditionBagItem>();

    [ForeignKey("IdCategory")]
    [InverseProperty("Items")]
    public virtual Category? IdCategoryNavigation { get; set; }

    [InverseProperty("IdItemNavigation")]
    public virtual ICollection<MapCellItem> MapCellItems { get; set; } = new List<MapCellItem>();

    [InverseProperty("IdItemNavigation")]
    public virtual ICollection<RecipeItemComponent> RecipeItemComponents { get; set; } = new List<RecipeItemComponent>();

    [InverseProperty("IdItemNavigation")]
    public virtual ICollection<RecipeItemResult> RecipeItemResults { get; set; } = new List<RecipeItemResult>();

    [InverseProperty("ProvokingItem")]
    public virtual ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();

    [InverseProperty("IdItemNavigation")]
    public virtual ICollection<RuinItemDrop> RuinItemDrops { get; set; } = new List<RuinItemDrop>();

    [InverseProperty("IdItemNavigation")]
    public virtual ICollection<TownBankItem> TownBankItems { get; set; } = new List<TownBankItem>();

    [InverseProperty("IdItemNavigation")]
    public virtual ICollection<TownWishListItem> TownWishListItems { get; set; } = new List<TownWishListItem>();

    [ForeignKey("IdItem")]
    [InverseProperty("IdItems")]
    public virtual ICollection<Action> ActionNames { get; set; } = new List<Action>();

    [ForeignKey("IdItem")]
    [InverseProperty("IdItems")]
    public virtual ICollection<WishlistCategorie> IdCategories { get; set; } = new List<WishlistCategorie>();

    [ForeignKey("IdItem")]
    [InverseProperty("IdItems")]
    public virtual ICollection<Property> PropertyNames { get; set; } = new List<Property>();
}
