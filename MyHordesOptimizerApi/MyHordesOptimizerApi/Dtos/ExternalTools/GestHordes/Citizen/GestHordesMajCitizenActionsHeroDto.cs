using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen
{
    public class GestHordesMajCitizenActionsHeroDto
    {
        [JsonProperty("rdh")]
        public bool? Rdh { get; set; }

        [JsonProperty("us")]
        public bool? Us { get; set; }

        [JsonProperty("sauvetage")]
        public bool? Sauvetage { get; set; }

        [JsonProperty("donJH")]
        public bool? DonJH { get; set; }

        [JsonProperty("pef")]
        public bool? Pef { get; set; }

        [JsonProperty("trouvaille")]
        public bool? Trouvaille { get; set; }

        [JsonProperty("corpsSain")]
        public bool? CorpsSain { get; set; }

        [JsonProperty("secondSouffle")]
        public bool? SecondSouffle { get; set; }

        [JsonProperty("vlm")]
        public bool? Vlm { get; set; }

        [JsonProperty("apag")]
        public int? Apag { get; set; }

        internal void ImportHeroicActionDetail(GestHordesMajCitizenActionsHeroDto ghActionHero)
        {
            Apag = ghActionHero.Apag;
            Vlm = ghActionHero.Vlm;
            SecondSouffle = ghActionHero.SecondSouffle;
            Trouvaille = ghActionHero.Trouvaille;
            Pef = ghActionHero.Pef;
            DonJH = ghActionHero.DonJH;
            Sauvetage = ghActionHero.Sauvetage;
            Us = ghActionHero.Us;
            Rdh = ghActionHero.Rdh;
        }

        internal void ImportStatusDetail(GestHordesMajCitizenActionsHeroDto ghStatus)
        {
            CorpsSain = ghStatus.CorpsSain;
        }
    }
}
