using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdTown", "Day", "IsPlanif")]
[Table("TownEstimation")]
[Index("IdLastUpdateInfo", Name = "idLastUpdateInfo")]
public partial class TownEstimation
{
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [Key]
    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    [Key]
    [Column("isPlanif", TypeName = "bit(1)")]
    public ulong IsPlanif { get; set; }

    [Column("_0Min", TypeName = "int(11)")]
    public int? _0min { get; set; }

    [Column("_0Max", TypeName = "int(11)")]
    public int? _0max { get; set; }

    [Column("_4Min", TypeName = "int(11)")]
    public int? _4min { get; set; }

    [Column("_4Max", TypeName = "int(11)")]
    public int? _4max { get; set; }

    [Column("_8Min", TypeName = "int(11)")]
    public int? _8min { get; set; }

    [Column("_8Max", TypeName = "int(11)")]
    public int? _8max { get; set; }

    [Column("_13Min", TypeName = "int(11)")]
    public int? _13min { get; set; }

    [Column("_13Max", TypeName = "int(11)")]
    public int? _13max { get; set; }

    [Column("_17Min", TypeName = "int(11)")]
    public int? _17min { get; set; }

    [Column("_17Max", TypeName = "int(11)")]
    public int? _17max { get; set; }

    [Column("_21Min", TypeName = "int(11)")]
    public int? _21min { get; set; }

    [Column("_21Max", TypeName = "int(11)")]
    public int? _21max { get; set; }

    [Column("_25Min", TypeName = "int(11)")]
    public int? _25min { get; set; }

    [Column("_25Max", TypeName = "int(11)")]
    public int? _25max { get; set; }

    [Column("_29Min", TypeName = "int(11)")]
    public int? _29min { get; set; }

    [Column("_29Max", TypeName = "int(11)")]
    public int? _29max { get; set; }

    [Column("_33Min", TypeName = "int(11)")]
    public int? _33min { get; set; }

    [Column("_33Max", TypeName = "int(11)")]
    public int? _33max { get; set; }

    [Column("_38Min", TypeName = "int(11)")]
    public int? _38min { get; set; }

    [Column("_38Max", TypeName = "int(11)")]
    public int? _38max { get; set; }

    [Column("_42Min", TypeName = "int(11)")]
    public int? _42min { get; set; }

    [Column("_42Max", TypeName = "int(11)")]
    public int? _42max { get; set; }

    [Column("_46Min", TypeName = "int(11)")]
    public int? _46min { get; set; }

    [Column("_46Max", TypeName = "int(11)")]
    public int? _46max { get; set; }

    [Column("_50Min", TypeName = "int(11)")]
    public int? _50min { get; set; }

    [Column("_50Max", TypeName = "int(11)")]
    public int? _50max { get; set; }

    [Column("_54Min", TypeName = "int(11)")]
    public int? _54min { get; set; }

    [Column("_54Max", TypeName = "int(11)")]
    public int? _54max { get; set; }

    [Column("_58Min", TypeName = "int(11)")]
    public int? _58min { get; set; }

    [Column("_58Max", TypeName = "int(11)")]
    public int? _58max { get; set; }

    [Column("_63Min", TypeName = "int(11)")]
    public int? _63min { get; set; }

    [Column("_63Max", TypeName = "int(11)")]
    public int? _63max { get; set; }

    [Column("_68Min", TypeName = "int(11)")]
    public int? _68min { get; set; }

    [Column("_68Max", TypeName = "int(11)")]
    public int? _68max { get; set; }

    [Column("_71Min", TypeName = "int(11)")]
    public int? _71min { get; set; }

    [Column("_71Max", TypeName = "int(11)")]
    public int? _71max { get; set; }

    [Column("_75Min", TypeName = "int(11)")]
    public int? _75min { get; set; }

    [Column("_75Max", TypeName = "int(11)")]
    public int? _75max { get; set; }

    [Column("_79Min", TypeName = "int(11)")]
    public int? _79min { get; set; }

    [Column("_79Max", TypeName = "int(11)")]
    public int? _79max { get; set; }

    [Column("_83Min", TypeName = "int(11)")]
    public int? _83min { get; set; }

    [Column("_83Max", TypeName = "int(11)")]
    public int? _83max { get; set; }

    [Column("_88Min", TypeName = "int(11)")]
    public int? _88min { get; set; }

    [Column("_88Max", TypeName = "int(11)")]
    public int? _88max { get; set; }

    [Column("_92Min", TypeName = "int(11)")]
    public int? _92min { get; set; }

    [Column("_92Max", TypeName = "int(11)")]
    public int? _92max { get; set; }

    [Column("_96Min", TypeName = "int(11)")]
    public int? _96min { get; set; }

    [Column("_96Max", TypeName = "int(11)")]
    public int? _96max { get; set; }

    [Column("_100Min", TypeName = "int(11)")]
    public int? _100min { get; set; }

    [Column("_100Max", TypeName = "int(11)")]
    public int? _100max { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("TownEstimations")]
    public virtual LastUpdateInfo IdLastUpdateInfoNavigation { get; set; }

    [ForeignKey("IdTown")]
    [InverseProperty("TownEstimations")]
    public virtual Town IdTownNavigation { get; set; }
}
