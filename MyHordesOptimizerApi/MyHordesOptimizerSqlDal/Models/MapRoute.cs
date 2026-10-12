using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>Tracé d'expédition saisi sur la carte de MHO (cf. 2026_10_05_map_routes.sql).</summary>
[Table("MapRoute")]
[Index("IdTown", Name = "MapRoute_idTown")]
public partial class MapRoute
{
    [Key]
    [Column("idMapRoute", TypeName = "int(11)")]
    public int IdMapRoute { get; set; }

    /// <summary>Town.IdTown résolu via ResolveTownId (clé provisoire -mapId possible, migrée par MigrateTownId) — pas de FK.</summary>
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("label")]
    [StringLength(64)]
    public string Label { get; set; } = null!;

    /// <summary>Clé de palette : la teinte affichée dépend du thème du site.</summary>
    [Column("color")]
    [StringLength(16)]
    public string Color { get; set; } = null!;

    [Column("idAuthor", TypeName = "int(11)")]
    public int IdAuthor { get; set; }

    /// <summary>Privé : visible de l'auteur et des citoyens de <see cref="MapRouteShares"/> seulement.</summary>
    [Column("isPrivate")]
    public bool IsPrivate { get; set; }

    /// <summary>Modifiable par tous ceux qui voient le tracé, sinon par l'auteur seul.</summary>
    [Column("isEditableByAll")]
    public bool IsEditableByAll { get; set; }

    /// <summary>Chemin case par case, JSON [[x,y],…] en coordonnées absolues.</summary>
    [Column("cells", TypeName = "longtext")]
    public string Cells { get; set; } = null!;

    /// <summary>Destinations cliquées, JSON [{"x":…,"y":…,"mode":"best"|"l"}].</summary>
    [Column("stops", TypeName = "longtext")]
    public string Stops { get; set; } = null!;

    /// <summary>PA du trajet : nombre de cases - 1.</summary>
    [Column("length", TypeName = "int(11)")]
    public int Length { get; set; }

    /// <summary>Concurrence optimiste : incrémentée à chaque modification.</summary>
    [Column("version", TypeName = "int(11)")]
    [ConcurrencyCheck]
    public int Version { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    public virtual LastUpdateInfo? IdLastUpdateInfoNavigation { get; set; }

    [InverseProperty("IdMapRouteNavigation")]
    public virtual ICollection<MapRouteShare> MapRouteShares { get; set; } = new List<MapRouteShare>();

    [InverseProperty("IdMapRouteNavigation")]
    public virtual ICollection<ExpeditionPart> ExpeditionParts { get; set; } = new List<ExpeditionPart>();
}
