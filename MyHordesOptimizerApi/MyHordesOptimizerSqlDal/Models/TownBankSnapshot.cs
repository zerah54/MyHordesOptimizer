using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>En-tête d'une version de la banque d'une ville (pas de FK vers Town : clés provisoires -mapId).</summary>
[PrimaryKey("IdTown", "IdLastUpdateInfo")]
[Table("TownBankSnapshot")]
[Index("IdTown", "Day", "IdLastUpdateInfo", Name = "TownBankSnapshot_idTown_day")]
[Index("IdLastUpdateInfo", Name = "TownBankSnapshot_idLastUpdateInfo")]
public partial class TownBankSnapshot
{
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int IdLastUpdateInfo { get; set; }

    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    [Column("contentHash", TypeName = "char(64)")]
    public string ContentHash { get; set; } = null!;

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("TownBankSnapshots")]
    public virtual LastUpdateInfo IdLastUpdateInfoNavigation { get; set; } = null!;
}
