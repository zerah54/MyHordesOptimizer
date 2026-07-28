using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdTown", "IdUser")]
[Table("TownCadaver")]
[Index("IdUser", Name = "TownCadaver_ibfk_1")]
[Index("CauseOfDeath", Name = "causeOfDeath")]
[Index("CleanUp", Name = "cleanUp")]
[Index("IdLastUpdateInfo", Name = "idLastUpdateInfo")]
public partial class TownCadaver
{
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Key]
    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [Column("survivalDay", TypeName = "int(11)")]
    public int? SurvivalDay { get; set; }

    /// <summary>
    /// Points d'âme gagnés par ce citoyen dans cette ville.
    /// </summary>
    /// <remarks>
    /// Valeur INDIVIDUELLE (<c>sp</c> = <c>$citizen-&gt;getPoints()</c>), à ne pas confondre avec le
    /// <c>score</c> que MyHordes expose au même endroit et qui est celui de la VILLE, recopié à
    /// l'identique sur chaque cadavre — c'est ce que cette colonne contenait avant le 2026-07-27.
    /// Le score de la ville vit sur <c>Town.Score</c>.
    /// Reste null pour les villes que MHO n'a vues que par <c>/json/towns</c> : cette route filtre
    /// les sous-champs de <c>citizens</c> par une liste blanche qui ne contient pas <c>sp</c>
    /// (<c>JSONv1Controller</c> l. 1925). <c>map.cadavers</c> et <c>playedMaps</c>, eux, le servent.
    /// </remarks>
    [Column("soulPoints", TypeName = "int(11)")]
    public int? SoulPoints { get; set; }

    [Column("deathMessage", TypeName = "text")]
    public string? DeathMessage { get; set; }

    [Column("townMessage", TypeName = "text")]
    public string? TownMessage { get; set; }

    [Column("causeOfDeath", TypeName = "int(11)")]
    public int? CauseOfDeath { get; set; }

    [Column("cleanUp", TypeName = "int(11)")]
    public int? CleanUp { get; set; }

    [ForeignKey("CauseOfDeath")]
    [InverseProperty("TownCadavers")]
    public virtual CauseOfDeath? CauseOfDeathNavigation { get; set; }

    [ForeignKey("CleanUp")]
    [InverseProperty("TownCadavers")]
    public virtual TownCadaverCleanUp? CleanUpNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("TownCadavers")]
    public virtual LastUpdateInfo? IdLastUpdateInfoNavigation { get; set; }

    [ForeignKey("IdTown")]
    [InverseProperty("TownCadavers")]
    public virtual Town IdTownNavigation { get; set; } = null!;

    [ForeignKey("IdUser")]
    [InverseProperty("TownCadavers")]
    public virtual User IdUserNavigation { get; set; } = null!;
}
