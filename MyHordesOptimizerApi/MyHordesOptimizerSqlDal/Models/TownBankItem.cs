using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdTown", "IdItem", "IdLastUpdateInfo", "IsBroken")]
[Table("TownBankItem")]
[Index("IdItem", Name = "idItem")]
[Index("IdLastUpdateInfo", Name = "idLastUpdateInfo")]
public partial class TownBankItem
{
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Key]
    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int IdLastUpdateInfo { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int? Count { get; set; }

    [Key]
    [Column("isBroken", TypeName = "bit(1)")]
    public ulong IsBroken { get; set; }

    [ForeignKey("IdItem")]
    [InverseProperty("TownBankItems")]
    public virtual Item IdItemNavigation { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("TownBankItems")]
    public virtual LastUpdateInfo IdLastUpdateInfoNavigation { get; set; }

    [ForeignKey("IdTown")]
    [InverseProperty("TownBankItems")]
    public virtual Town IdTownNavigation { get; set; }
}
