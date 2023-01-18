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

        [Column("x")]
        public int X { get; set; }

        [Column("y")]
        public int Y { get; set; }

        [Column("width")]
        public int Width { get; set; }

        [Column("height")]
        public int Height { get; set; }

        [Column("day")]
        public int Day { get; set; }

        [Column("waterWell")]
        public int WaterWell { get; set; }

        [Column("isDoorOpen")]
        public bool IsDoorOpen { get; set; }

        [Column("isChaos")]
        public bool IsChaos { get; set; }

        [Column("isDevasted")]
        public bool IsDevasted { get; set; }

        [Column("wishlistDateUpdate")]
        public DateTime? WishlistDateUpdate { get; set; }

        [Column("idUserWishListUpdater")]
        public int? IdUserWishListUpdater { get; set; }
    }
}
