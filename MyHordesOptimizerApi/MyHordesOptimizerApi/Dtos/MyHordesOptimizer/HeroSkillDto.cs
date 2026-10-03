using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class HeroSkillDto
    {
        public const string DefaultLocale = "de";

        public string Name { get; set; }
        public Dictionary<string, string> Description { get; set; }
        public string Icon { get; set; }
        public Dictionary<string, string> Label { get; set; }
        public int NbUses { get; set; }
        public int DaysNeeded { get; set; }
        /// <summary>Compétence de l'ancien système.</summary>
        public bool Legacy { get; set; }
        /// <summary>Groupe traduit (fr, en, es, de) de l'arbre actuel ; null hors de l'arbre.</summary>
        public Dictionary<string, string>? Group { get; set; }
        /// <summary>Ordre d'affichage du groupe ; null hors de l'arbre.</summary>
        public int? GroupSort { get; set; }
        /// <summary>Niveau dans le groupe (0 à 3) ; null hors de l'arbre.</summary>
        public int? Level { get; set; }
        /// <summary>Avantages traduits par langue (fr, en, es, de) ; listes vides hors de l'arbre, jamais null.</summary>
        public Dictionary<string, List<string>> Bullets { get; set; }

        public HeroSkillDto()
        {
            Description = new Dictionary<string, string>();
            Label = new Dictionary<string, string>();
            Bullets = new Dictionary<string, List<string>>();
        }
    }
}
