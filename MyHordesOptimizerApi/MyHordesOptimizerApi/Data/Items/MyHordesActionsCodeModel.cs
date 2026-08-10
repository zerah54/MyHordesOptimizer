using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.Items
{
    /// <summary>
    /// Contraintes qu'une action impose au citoyen (ex. "have_can_opener") — seul champ exploité
    /// pour l'instant, par <see cref="MyHordesOptimizerApi.MappingProfiles.Items.ItemOpenerResolver"/>.
    /// </summary>
    public class MyHordesActionsCodeModel
    {
        [JsonProperty("meta")]
        public List<string> Meta { get; set; } = new List<string>();
    }
}
