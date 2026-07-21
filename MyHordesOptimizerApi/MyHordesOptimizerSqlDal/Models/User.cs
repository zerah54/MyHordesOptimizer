using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

public partial class User
{
    [Key]
    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Column("name")]
    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string Name { get; set; } = null!;

    [Column("avatar")]
    [StringLength(255)]
    public string? Avatar { get; set; }

    [Column("pictosHistoryImportedAt")]
    public DateTime? PictosHistoryImportedAt { get; set; }

    /// <summary>
    /// Dernier import de l'historique des villes jouées (playedMaps). Null = jamais importé, seul cas
    /// où la synchronisation de connexion s'en charge : l'opération est trop lourde pour tourner sous
    /// le verrou global à chaque getMe. Ensuite, elle passe par l'import des pictos, qui remonte le
    /// même historique.
    /// </summary>
    [Column("playedMapsImportedAt")]
    public DateTime? PlayedMapsImportedAt { get; set; }

    /// <summary>
    /// Dernier rafraîchissement du pseudo via /json/users. Null = jamais rafraîchi : le nom peut
    /// provenir d'un chemin « cadavre » et donc être un alias de ville.
    /// </summary>
    [Column("nameRefreshedAt")]
    public DateTime? NameRefreshedAt { get; set; }

    #region Statistiques dénormalisées pour l'annuaire

    // Recalculées par RecomputeUserDirectoryStats : la liste est paginée côté serveur et ne peut pas
    // se permettre un COUNT/MAX joint par page.

    [Column("nbTownsPlayed", TypeName = "int(11)")]
    public int NbTownsPlayed { get; set; }

    [Column("bestSurvival", TypeName = "int(11)")]
    public int? BestSurvival { get; set; }

    /// <summary>
    /// Ville la plus récente du joueur. Proxy temporel : aucune date de jeu n'existe dans le schéma,
    /// mais les idTown MyHordes sont séquentiels.
    /// </summary>
    [Column("lastTownId", TypeName = "int(11)")]
    public int? LastTownId { get; set; }

    #endregion

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<ExpeditionCitizen> ExpeditionCitizens { get; set; } = new List<ExpeditionCitizen>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<LastUpdateInfo> LastUpdateInfos { get; set; } = new List<LastUpdateInfo>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<MapCellDig> MapCellDigs { get; set; } = new List<MapCellDig>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<TownCadaver> TownCadavers { get; set; } = new List<TownCadaver>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<TownCitizenBath> TownCitizenBaths { get; set; } = new List<TownCitizenBath>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<TownCitizen> TownCitizens { get; set; } = new List<TownCitizen>();

    [InverseProperty("IdUserWishListUpdaterNavigation")]
    public virtual ICollection<Town> Towns { get; set; } = new List<Town>();

    [InverseProperty("IdUserAuthorNavigation")]
    public virtual ICollection<WishlistCategorie> WishlistCategories { get; set; } = new List<WishlistCategorie>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<UserPicto> UserPictos { get; set; } = new List<UserPicto>();

    [InverseProperty("IdUserNavigation")]
    public virtual ICollection<TownCitizenPicto> TownCitizenPictos { get; set; } = new List<TownCitizenPicto>();
}
