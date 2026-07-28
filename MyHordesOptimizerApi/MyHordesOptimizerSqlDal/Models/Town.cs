using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Town")]
[Index("IdUserWishListUpdater", Name = "Town_fkuserwishlist")]
public partial class Town
{
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("idUserWishListUpdater", TypeName = "int(11)")]
    public int? IdUserWishListUpdater { get; set; }

    [Column("wishlistDateUpdate", TypeName = "datetime")]
    public DateTime? WishlistDateUpdate { get; set; }

    [Column("x", TypeName = "int(11)")]
    public int X { get; set; }

    [Column("y", TypeName = "int(11)")]
    public int Y { get; set; }

    [Column("width", TypeName = "int(11)")]
    public int Width { get; set; }

    [Column("height", TypeName = "int(11)")]
    public int Height { get; set; }

    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    [Column("waterWell", TypeName = "int(11)")]
    public int WaterWell { get; set; }

    [Column("name", TypeName = "nvarchar(255)")]
    public string? Name { get; set; }

    [Column("townType", TypeName = "int(11)")]
    public int? TownTypeId { get; set; }

    [Column("season", TypeName = "int(11)")]
    public int? Season { get; set; }

    [Column("phase", TypeName = "int(11)")]
    public int? PhaseId { get; set; }

    [Column("language", TypeName = "nvarchar(10)")]
    public string? Language { get; set; }

    [Column("score", TypeName = "int(11)")]
    public int? Score { get; set; }

    /// <summary>
    /// La ville a-t-elle activé l'option d'API externe ? Null tant qu'on ne l'a pas constaté.
    /// </summary>
    /// <remarks>
    /// Constaté, jamais deviné : MyHordes renvoie <c>{"error":"ApiDisabled"}</c> à la place des
    /// données de carte quand l'option est coupée (garde <c>OptFeatureXml</c> dans
    /// <c>getMapData</c>, qui sert aussi bien <c>/json/map</c> que la branche <c>map</c> de
    /// <c>/json/me</c>). Une ville sans API ne nous transmettra jamais <c>baseDef</c> : c'est la
    /// seule où la saisie manuelle du niveau de maison garde un sens.
    /// </remarks>
    [Column("hasExternalApi")]
    public bool? HasExternalApi { get; set; }

    /// <summary>
    /// Identifiant du joueur portant le rôle de Chaman, ou null si personne ne le porte.
    /// </summary>
    /// <remarks>
    /// Un seul porteur par ville à la fois, mais il peut changer en cours de partie (mort,
    /// bannissement). MyHordes ne renvoie que le DERNIER porteur, et seulement s'il est VIVANT :
    /// le champ est omis sinon, ce qui vaut « plus personne » et doit remettre la colonne à null.
    /// Cette écriture n'est donc légitime que depuis une source qui demande les trois rôles —
    /// voir <c>TownExtensions.UpdateRolesFromMapDetails</c>.
    /// </remarks>
    [Column("idShaman", TypeName = "int(11)")]
    public int? IdShaman { get; set; }

    /// <summary>Identifiant du Guide de l'Outre-Monde. Mêmes règles que <see cref="IdShaman"/>.</summary>
    [Column("idGuide", TypeName = "int(11)")]
    public int? IdGuide { get; set; }

    /// <summary>Identifiant du Responsable de la catapulte. Mêmes règles que <see cref="IdShaman"/>.</summary>
    [Column("idCata", TypeName = "int(11)")]
    public int? IdCata { get; set; }

    [Column("mapId", TypeName = "int(11)")]
    public int? MapId { get; set; }

    /// <summary>
    /// Date du dernier import de cette ville depuis le classement (<c>/json/towns</c>), ou null si
    /// elle n'en a jamais fait l'objet.
    /// </summary>
    /// <remarks>
    /// Point de reprise de l'import d'une saison : MyHordes tronque <c>/json/towns</c> à 50
    /// identifiants et limite la clé personnelle à 150 requêtes par heure glissante, si bien qu'une
    /// saison ancienne ne s'importe qu'en plusieurs passes. Null ne se déduit PAS de l'absence de la
    /// ligne : <c>UpsertPlayedMaps</c> crée des lignes <c>Town</c> sans jamais importer leurs
    /// cadavres, et il faut pouvoir les compléter.
    /// </remarks>
    [Column("rankingImportedAt", TypeName = "datetime")]
    public DateTime? RankingImportedAt { get; set; }

    [Column("isFinished")]
    public bool IsFinished { get; set; }

    [Column("isDoorOpen")]
    public bool IsDoorOpen { get; set; }

    [Column("isChaos")]
    public bool IsChaos { get; set; }

    [Column("isDevasted")]
    public bool IsDevasted { get; set; }

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<Expedition> Expeditions { get; set; } = new List<Expedition>();

    [ForeignKey("IdUserWishListUpdater")]
    [InverseProperty("Towns")]
    public virtual User? IdUserWishListUpdaterNavigation { get; set; }

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<MapCellDigUpdate> MapCellDigUpdates { get; set; } = new List<MapCellDigUpdate>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<MapCell> MapCells { get; set; } = new List<MapCell>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownBankItem> TownBankItems { get; set; } = new List<TownBankItem>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownCadaver> TownCadavers { get; set; } = new List<TownCadaver>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownCitizenBath> TownCitizenBaths { get; set; } = new List<TownCitizenBath>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownCitizen> TownCitizens { get; set; } = new List<TownCitizen>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownCitizenPicto> TownCitizenPictos { get; set; } = new List<TownCitizenPicto>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownEstimation> TownEstimations { get; set; } = new List<TownEstimation>();

    [InverseProperty("IdTownNavigation")]
    public virtual ICollection<TownWishListItem> TownWishListItems { get; set; } = new List<TownWishListItem>();

}