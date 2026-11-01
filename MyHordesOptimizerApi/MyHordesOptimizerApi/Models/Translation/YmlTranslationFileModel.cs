using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models.Translation
{
    public class YmlTranslationFileModel
    {
        public string Name { get; set; } = null!;
        public string DestinationLocale { get; set; } = null!;
        /// <summary>
        /// Dictionnaire des traductions. La clef est le label en 'de', la valeur la traduction dans la langue de destination
        /// </summary>
        public Dictionary<string, string> Translations { get; set; } = null!;
    }
}
