using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("Users")]
    public class UsersModel
    {
        [Key]
        [Column("idUser")]
        public int IdUser { get; set; }
        [Column("name")]
        public string Name { get; set; }
        [Column("userKey")]
        public string UserKey { get; set; }
    }
}
