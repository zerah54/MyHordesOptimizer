using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Champ <c>avatarData</c> de <c>getUserData</c> : l'avatar en objet structuré, là où
    /// <c>avatar</c> ne renvoie que l'URL. Les deux se demandent séparément.
    /// </summary>
    public class MyHordesAvatarDataDto
    {
        [JsonProperty("url")]
        public string? Url { get; set; }

        /// <summary>Largeur réelle de la conversion retenue, en pixels.</summary>
        [JsonProperty("x")]
        public int? X { get; set; }

        /// <summary>Hauteur réelle de la conversion retenue, en pixels.</summary>
        [JsonProperty("y")]
        public int? Y { get; set; }

        /// <summary>Vrai si la conversion est taguée « classic », c'est-à-dire un ancien avatar.</summary>
        [JsonProperty("classic")]
        public bool? Classic { get; set; }

        /// <summary>Extension déduite du type MIME (<c>MediaService::mimeTypeToExtension</c>).</summary>
        [JsonProperty("format")]
        public string? Format { get; set; }
    }
}
