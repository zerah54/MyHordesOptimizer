using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Keyless]
public partial class MapCellComplet
{
    [Column("idCell", TypeName = "int(11)")]
    public int? IdCell { get; set; }

    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [Column("x", TypeName = "int(11)")]
    public int? X { get; set; }

    [Column("y", TypeName = "int(11)")]
    public int? Y { get; set; }

    [Column("isVisitedToday")]
    public bool? IsVisitedToday { get; set; }

    [Column("isNeverVisited")]
    public bool? IsNeverVisited { get; set; }

    [Column("dangerLevel", TypeName = "int(11)")]
    public int? DangerLevel { get; set; }

    [Column("idRuin", TypeName = "int(11)")]
    public int? IdRuin { get; set; }

    [Column("isDryed")]
    public bool? IsDryed { get; set; }

    [Column("nbZombie", TypeName = "int(11)")]
    public int? NbZombie { get; set; }

    [Column("nbZombieKilled", TypeName = "int(11)")]
    public int? NbZombieKilled { get; set; }

    [Column("nbHero", TypeName = "int(11)")]
    public int? NbHero { get; set; }

    [Column("isRuinCamped")]
    public bool? IsRuinCamped { get; set; }

    [Column("isRuinDryed")]
    public bool? IsRuinDryed { get; set; }

    [Column("nbRuinDig", TypeName = "int(11)")]
    public int? NbRuinDig { get; set; }

    [Column("averagePotentialRemainingDig")]
    public float? AveragePotentialRemainingDig { get; set; }

    [Column("maxPotentialRemainingDig", TypeName = "int(11)")]
    public int? MaxPotentialRemainingDig { get; set; }

    [Column("isTown")]
    public bool? IsTown { get; set; }

    [Column("note", TypeName = "text")]
    public string? Note { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? LastUpdateDateUpdate { get; set; }

    [Column(TypeName = "int(11)")]
    public int? LastUpdateInfoUserId { get; set; }

    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? LastUpdateInfoUserName { get; set; }

    [Column(TypeName = "int(11)")]
    public int TownX { get; set; }

    [Column(TypeName = "int(11)")]
    public int TownY { get; set; }

    [Column(TypeName = "int(11)")]
    public int MapHeight { get; set; }

    [Column(TypeName = "int(11)")]
    public int MapWidth { get; set; }

    [Column("isChaos")]
    public bool IsChaos { get; set; }

    [Column("isDevasted")]
    public bool IsDevasted { get; set; }

    [Column("isDoorOpen")]
    public bool IsDoorOpen { get; set; }

    [Column("waterWell", TypeName = "int(11)")]
    public int WaterWell { get; set; }

    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    [StringLength(255)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? CitizenName { get; set; }

    [Column(TypeName = "int(11)")]
    public int? CitizenId { get; set; }

    [Column(TypeName = "int(11)")]
    public int? ItemId { get; set; }

    [Column(TypeName = "int(11)")]
    public int? ItemCount { get; set; }

    public bool? IsItemBroken { get; set; }

    [Column("totalSucces")]
    [Precision(32, 0)]
    public decimal? TotalSucces { get; set; }

    [Column("nbKm", TypeName = "int(11)")]
    public int? NbKm { get; set; }

    [Column("nbPa", TypeName = "int(11)")]
    public int? NbPa { get; set; }

    [Column("zoneRegen", TypeName = "int(11)")]
    public int? ZoneRegen { get; set; }
}
