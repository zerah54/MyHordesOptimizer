using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("Property")]
    public class PropertyModel
    {
        [Key]
        [Column("name")]
        public string Name { get; set; }
    }
}
