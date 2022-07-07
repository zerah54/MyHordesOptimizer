using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("LastUpdateInfo")]
    public class LastUpdateInfoModel
    {
        [Key]
        [Column("idLastUpdateInfo")]
        public int? IdLastUpdateInfo { get; set; }
        [Column("dateUpdate")]
        public DateTime DateUpdate { get; set; }
        [Column("idUser")]
        public string IdUser { get; set; }
    }
}
