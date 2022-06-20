using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Views.Items
{
    [Table("ItemComplet")]
    public class ItemCompletModel
    {
        [Column("idItem")]
        public int IdItem { get; set; }
        [Column("idCategory")]
        public int IdCategory { get; set; }
        [Column("itemUid")]
        public string ItemUid { get; set; }
        [Column("itemDeco")]
        public int ItemDeco { get; set; }
        [Column("itemLabel_fr")]
        public string ItemLabelFr { get; set; }
        [Column("itemLabel_en")]
        public string ItemLabelEn { get; set; }
        [Column("itemLabel_es")]
        public string ItemLabelEs { get; set; }
        [Column("itemLabel_de")]
        public string ItemLabelDe { get; set; }
        [Column("itemDescription_fr")]
        public string ItemDescriptionFr { get; set; }
        [Column("itemDescription_en")]
        public string ItemDescriptionEn { get; set; }
        [Column("itemDescription_es")]
        public string ItemDescriptionEs { get; set; }
        [Column("itemDescription_de")]
        public string ItemDescriptionDe { get; set; }
        [Column("itemGuard")]
        public int ItemGuard { get; set; }
        [Column("itemImg")]
        public string ItemImg { get; set; }
        [Column("itemIsHeaver")]
        public bool ItemIsHeaver { get; set; }
        [Column("catName")]
        public string CatName { get; set; }
        [Column("catOrdering")]
        public int CatOrdering { get; set; }
        [Column("catLabel_fr")]
        public string CatLabelFr { get; set; }
        [Column("catLabel_en")]
        public string CatLabelEn { get; set; }
        [Column("catLabel_es")]
        public string CatLabelEs { get; set; }
        [Column("catLabel_de")]
        public string CatLabelDe { get; set; }
        [Column("actionName")]
        public string ActionName { get; set; }
        [Column("propertyName")]
        public string PropertyName { get; set; }

    }
}
