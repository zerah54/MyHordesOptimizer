using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Data.Heroes
{
    public class MyHordesHerosCapacitiesCodeModel
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("title")]
        public string Title { get; set; }

        [JsonProperty("description")]
        public string Description { get; set; }

        [JsonProperty("icon")]
        public string Icon { get; set; }

        /// <summary>
        /// MyHordes a renommé « daysNeeded » en « unlockAt ». Le champ « action » a disparu
        /// du référentiel amont ; rien ne le lisait.
        /// </summary>
        [JsonProperty("unlockAt")]
        public int UnlockAt { get; set; }

        /// <summary>
        /// Vrai pour les compétences de l'ancien système. Absent (donc faux) pour l'arbre actuel et pour les
        /// pouvoirs de powers.json.
        /// </summary>
        [JsonProperty("legacy")]
        public bool Legacy { get; set; }

        /// <summary>
        /// Groupe de l'arbre actuel (libellé allemand : Strategie, Umsicht…). Absent pour les compétences
        /// historiques et les pouvoirs.
        /// </summary>
        [JsonProperty("group")]
        public string? Group { get; set; }

        /// <summary>Ordre d'affichage du groupe dans l'arbre.</summary>
        [JsonProperty("sort")]
        public int? Sort { get; set; }

        /// <summary>Niveau dans le groupe (0 à 3).</summary>
        [JsonProperty("level")]
        public int? Level { get; set; }

        /// <summary>Avantages apportés par le niveau, en allemand.</summary>
        [JsonProperty("bullets")]
        public List<string>? Bullets { get; set; }

        /// <summary>
        /// Propriétés que le niveau donne au citoyen (<c>CitizenProperties</c> de MyHordes), cumulées avec les
        /// niveaux inférieurs du groupe : <c>features.pro.camper</c>, <c>props.limit.camping.pro</c>…
        /// </summary>
        [JsonProperty("citizenProperties")]
        public Dictionary<string, JToken>? CitizenProperties { get; set; }

        /// <summary>
        /// Domaine de traduction du jeu (préfixe du fichier yml) dans lequel chercher les libellés :
        /// « game » pour les compétences, « items » pour les actions héroïques de powers.json.
        /// Posé par le dépôt, absent du JSON.
        /// </summary>
        [JsonIgnore]
        public string TranslationDomain { get; set; } = "game";
    }
}
