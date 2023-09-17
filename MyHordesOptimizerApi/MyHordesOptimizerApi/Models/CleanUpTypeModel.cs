using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("TownCadaverCleanUpType")]
    public class CleanUpTypeModel
    {
        [Key]
        [Column("idType")]
        public int IdType { get; set; }
        [Column("typeName")]
        public string TypeName { get; set; }
        [Column("myHordesApiName")]
        public string MyHordesApiName { get; set; }
    }
}
