using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("TownCadaverCleanUp")]
    public class CleanUpModel
    {
        [Key]
        [Column("idCleanUp")]
        public int IdCleanUp { get; set; }
        [Column("idCleanUpType")]
        public int IdCleanUpType { get; set; }
        [Column("idUserCleanUp")]
        public int IdUserCleanUp { get; set; }
    }
}
