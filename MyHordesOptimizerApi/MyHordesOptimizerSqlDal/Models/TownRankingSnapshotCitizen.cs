using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>Citoyen d'une ville de l'instantané. Sans FK vers Users : il peut être inconnu de notre base.</summary>
[PrimaryKey("RankingId", "IdUser")]
[Table("TownRankingSnapshotCitizen")]
public partial class TownRankingSnapshotCitizen
{
    [Column("rankingId", TypeName = "int(11)")]
    public int RankingId { get; set; }

    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }
}
