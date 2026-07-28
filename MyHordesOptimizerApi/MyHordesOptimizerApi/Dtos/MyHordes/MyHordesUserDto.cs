using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Un compte joueur et, s'il en a un, son citoyen actif — sortie de <c>getUserData</c>.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Ce type couvre les positions qui ne portent AUCUNE branche vers un autre utilisateur :
    /// <c>map.citizens</c> (via <c>getCitizensData</c>, qui délègue à <c>getUserData</c> après
    /// avoir retiré <c>map</c>) et <c>/json/users</c> (via <c>getUsersAPI</c>). Les positions qui
    /// portent ces branches utilisent <see cref="MyHordesUserDetailsDto"/>.
    /// </para>
    /// <para>
    /// À ne pas confondre avec <see cref="MyHordesCitizenRankingDto"/>, l'autre notion de
    /// « citoyen » de l'API : celle-ci décrit une entrée de CLASSEMENT et passe par
    /// <c>getCadaversInformation</c>. Les deux ne se recouvrent pas.
    /// </para>
    /// <para>
    /// Différence qui compte pour <c>User.name</c> : <c>getUserData</c> renvoie TOUJOURS le pseudo
    /// réel du compte, là où <c>getCadaversInformation</c> renvoie <c>getAlias() ?? getName()</c>,
    /// donc un nom d'emprunt dans les villes à alias. Ce type est donc la seule source faisant
    /// autorité sur le pseudo d'un joueur.
    /// </para>
    /// <para>
    /// Les champs liés au citoyen actif (<see cref="HomeMessage"/>, <see cref="Hero"/>,
    /// <see cref="Dead"/>, <see cref="Out"/>, <see cref="Ban"/>, <see cref="BaseDef"/>,
    /// <see cref="X"/>, <see cref="Y"/>, <see cref="MapId"/>, <see cref="Job"/>) ne sont émis que
    /// si le joueur EN A un : côté MyHordes ils vivent dans un bloc <c>if ($current_citizen)</c>.
    /// </para>
    /// </remarks>
    public class MyHordesUserDto
    {
        [JsonProperty("id")]
        public int? Id { get; set; }

        /// <summary>Identifiant Twinoid historique (<c>User::getTwinoidID</c>).</summary>
        [JsonProperty("twinId")]
        public int? TwinId { get; set; }

        /// <summary>Identifiant EternalTwin (<c>User::getEternalID</c>).</summary>
        [JsonProperty("etwinId")]
        public string? EtwinId { get; set; }

        /// <summary>Pseudo réel du compte, jamais un alias de ville.</summary>
        [JsonProperty("name")]
        public string? Name { get; set; }

        /// <summary>Langue du COMPTE (<c>User::getLanguage</c>), pas celle de la ville.</summary>
        [JsonProperty("locale")]
        public string? Locale { get; set; }

        /// <summary>
        /// URL de l'avatar, ou <c>null</c> si le joueur n'en a pas.
        /// </summary>
        /// <remarks>
        /// Le convertisseur est INDISPENSABLE : selon la branche, MyHordes renvoie le booléen
        /// <c>false</c> au lieu de rien. Voir <see cref="AvatarUrlConverter"/>.
        /// </remarks>
        [JsonProperty("avatar")]
        [JsonConverter(typeof(AvatarUrlConverter))]
        public string? Avatar { get; set; }

        /// <summary>
        /// L'avatar en objet structuré plutôt qu'en URL nue. Jamais demandé aujourd'hui.
        /// </summary>
        [JsonProperty("avatarData")]
        public MyHordesAvatarDataDto? AvatarData { get; set; }

        /// <summary>Vrai quand le joueur n'a AUCUN citoyen actif (donc hors de toute ville).</summary>
        [JsonProperty("isGhost")]
        public bool? IsGhost { get; set; }

        /// <summary>Description de la maison du citoyen actif.</summary>
        [JsonProperty("homeMessage")]
        public string? HomeMessage { get; set; }

        /// <summary>Vrai si le métier du citoyen actif est héroïque.</summary>
        [JsonProperty("hero")]
        public bool? Hero { get; set; }

        [JsonProperty("dead")]
        public bool? Dead { get; set; }

        /// <summary>Vrai si le citoyen actif est HORS de la ville (en zone).</summary>
        [JsonProperty("out")]
        public bool? Out { get; set; }

        /// <summary>Banni de la ville.</summary>
        [JsonProperty("ban")]
        public bool? Ban { get; set; }

        /// <summary>Défense apportée par la maison du citoyen actif.</summary>
        [JsonProperty("baseDef")]
        public int? BaseDef { get; set; }

        /// <summary>
        /// Abscisse en coordonnées MyHordes (origine décalée par l'offset de la ville). Vaut celle
        /// de la ville quand le citoyen est en ville ou que la ville est en chaos.
        /// </summary>
        [JsonProperty("x")]
        public int? X { get; set; }

        /// <summary>Ordonnée, axe inversé par rapport à l'interne. Voir <see cref="X"/>.</summary>
        [JsonProperty("y")]
        public int? Y { get; set; }

        /// <summary>Identifiant de la ville du citoyen actif (townId interne MyHordes).</summary>
        [JsonProperty("mapId")]
        public int? MapId { get; set; }

        [JsonProperty("job")]
        public MyHordesJob? Job { get; set; }
    }
}
