using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models;

[Table("Season")]
public partial class Season
{
    [Key]
    [Column("idSeason", TypeName = "int(11)")]
    public int IdSeason { get; set; }

    [Column("isCurrent")]
    public bool IsCurrent { get; set; }

    [Column("isFinished")]
    public bool IsFinished { get; set; }
}
