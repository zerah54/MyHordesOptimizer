namespace MyHordesOptimizerApi.Models
{
    public class ItemModel
    {
        public int IdItem { get; set; }
        public int IdCategory { get; set; }
        public int IdAction { get; set; }
        public int IdProperty { get; set; }
        public string Uid { get; set; }
        public int Deco { get; set; }
        public string LabelFr { get; set; }
        public string LabelEn { get; set; }
        public string LabelEs { get; set; }
        public string LabelDe { get; set; }
        public string DescriptionFr { get; set; }
        public string DescriptionEn { get; set; }
        public string DescriptionEs { get; set; }
        public string DescriptionDe { get; set; }
        public int Guard { get; set; }
        public string Img { get; set; }
        public bool IsHeaver { get; set; }

    }
}
