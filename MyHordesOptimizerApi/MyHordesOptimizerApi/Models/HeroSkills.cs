namespace MyHordesOptimizerApi.Models
{
    public class HeroSkills
    {
        public int IdHeroSkill { get; set; }
        public string Name { get; set; }
        public int DaysNeeded { get; set; }
        public string DescriptionFr { get; set; }
        public string DescriptionEn { get; set; }
        public string DescriptionEs { get; set; }
        public string DescriptionDe { get; set; }
        public string Icon { get; set; }
        public string LabelFr { get; set; }
        public string LabelEn { get; set; }
        public string LabelEs { get; set; }
        public string LabelDe { get; set; }
        public int NbUses { get; set; }
    }
}
