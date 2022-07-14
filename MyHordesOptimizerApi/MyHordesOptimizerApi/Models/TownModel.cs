using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("Town")]
    public class TownModel
    {
        [Key]
        [Column("idTown")]
        public int IdTown { get; set; }

        [Column("wishlistDateUpdate")]
        public DateTime? WishlistDateUpdate { get; set; }

        [Column("idUserWishListUpdater")]
        public int? IdUserWishListUpdater { get; set; }
    }
}
