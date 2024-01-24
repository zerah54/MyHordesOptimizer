using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Expeditions
{
    [Table("Expedition")]
    public class ExpeditionModel
    {
        [Key]
        [Column("idExpedition")]
        public int IdExpedition { get; set; }

        [Column("idTown")]
        public int IdTown { get; set; }

        [Column("idLastUpdateInfo")]
        public int IdLastUpdateInfo { get; set; }

        [Column("day")]
        public int Day { get; set; }

        [Column("state")]
        public string State { get; set; }

        [Column("label")]
        public string Label { get; set; }

        [Column("minPdc")]
        public int MinPdc { get; set; }

        public List<ExpeditionPartModel> Parts { get; set; }
    }
}
