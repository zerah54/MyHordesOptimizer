using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.UserAvailability
{
    [Table("UserAvailabilityType")]
    public class UserAvailabilityTypeModel
    {
        [Key]
        [Column("idUserAvailabilityType")]
        public int IdType { get; set; }
        [Column("typeName_fr")]
        public string NameFr { get; set; }
        [Column("typeName_en")]
        public string NameEn { get; set; }
        [Column("typeName_es")]
        public string NameEs { get; set; }
        [Column("typeName_de")]
        public string NameDe { get; set; }
    }
}
