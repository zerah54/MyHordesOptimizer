using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Views.Ruins
{
    [Table("RuinComplete")]
    public class RuinCompletModel
    {
        [Column("idRuin")]
        public int IdRuin { get; set; }
        [Column("ruinLabel_fr")]
        public string RuinLabelFr { get; set; }
        [Column("ruinLabel_en")]
        public string RuinLabelEn { get; set; }
        [Column("ruinLabel_es")]
        public string RuinLabelEs { get; set; }
        [Column("ruinLabel_de")]
        public string RuinLabelDe { get; set; }
        [Column("ruinDescription_fr")]
        public string RuinDescriptionFr { get; set; }
        [Column("ruinDescription_en")]
        public string RuinDescriptionEn { get; set; }
        [Column("ruinDescription_es")]
        public string RuinDescriptionEs { get; set; }
        [Column("ruinDescription_de")]
        public string RuinDescriptionDe { get; set; }
        [Column("ruinExplorable")]
        public bool RuinExplorable { get; set; }
        [Column("ruinImg")]
        public string RuinImg { get; set; }
        [Column("ruinCamping")]
        public int RuinCamping { get; set; }
        [Column("ruinMinDist")]
        public int RuinMinDist { get; set; }
        [Column("ruinMaxDist")]
        public int RuinMaxDist { get; set; }
        [Column("ruinChance")]
        public int RuinChance { get; set; }
        [Column("ruinCapacity")]
        public int RuinCapacity { get; set; }
        [Column("idItem")]
        public int IdItem { get; set; }
        [Column("itemUid")]
        public string ItemUid { get; set; }
        [Column("itemLabel_fr")]
        public string ItemLabelFr { get; set; }
        [Column("dropProbability")]
        public float DropProbability { get; set; }
        [Column("dropWeight")]
        public int DropWeight { get; set; }
    }
}
