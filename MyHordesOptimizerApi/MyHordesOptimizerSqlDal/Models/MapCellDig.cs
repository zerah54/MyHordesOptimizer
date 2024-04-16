using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdCell", "IdUser", "Day")]
[Table("MapCellDig")]
[Index("IdLastUpdateInfo", Name = "idLastUpdateInfo")]
[Index("IdUser", Name = "idUser")]
public partial class MapCellDig
{
    [Key]
    [Column("idCell", TypeName = "int(11)")]
    public int IdCell { get; set; }

    [Key]
    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Key]
    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    [Column("nbSucces", TypeName = "int(11)")]
    public int? NbSucces { get; set; }

    [Column("nbTotalDig", TypeName = "int(11)")]
    public int? NbTotalDig { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int? IdLastUpdateInfo { get; set; }

    [ForeignKey("IdCell")]
    [InverseProperty("MapCellDigs")]
    public virtual MapCell IdCellNavigation { get; set; } = null!;

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("MapCellDigs")]
    public virtual LastUpdateInfo? IdLastUpdateInfoNavigation { get; set; }

    [ForeignKey("IdUser")]
    [InverseProperty("MapCellDigs")]
    public virtual User IdUserNavigation { get; set; } = null!;
}
