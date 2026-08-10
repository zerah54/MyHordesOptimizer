using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    /// <summary>
    /// Représentation minimale d'un objet, utilisée dans les relations objet↔objet (ex. boîtes et
    /// ouvre-boîtes) pour éviter qu'un <see cref="MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer.ItemWithoutRecipeDto"/>
    /// n'embarque un autre objet qui l'embarquerait à son tour en retour.
    /// </summary>
    public class ItemSummaryDto
    {
        public string Uid { get; set; }
        public string Img { get; set; }
        public string ImgBroken { get; set; }
        public IDictionary<string, string> Label { get; set; }
    }
}
