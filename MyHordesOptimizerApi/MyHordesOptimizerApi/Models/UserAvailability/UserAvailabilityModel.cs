using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.UserAvailability
{
    [Table("UserAvailability")]
    public class UserAvailabilityModel
    {
        [Key]
        [Column("idUserAvailability")]
        public int IdUserAvailability { get; set; }
        [Column("idUser")]
        public int IdUser { get; set; }
        [Column("idTown")]
        public int IdTown { get; set; }
        [Column("startDate")]
        public DateTime StartDate { get; set; }
        [Column("endDate")]
        public DateTime EndDate { get; set; }
        [Column("userAvailabilityType")]
        public int UserAvailabilityType { get; set; }
        [Column("comment")]
        public string Comment { get; set; }
        [Column("canLead")]
        public bool CanLead { get; set; }
    }
}
