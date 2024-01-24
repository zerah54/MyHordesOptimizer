using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Expeditions
{
    [Table("ExpeditionCitizen")]
    public class ExpeditionCitizenModel
    {
        [Key]
        [Column("idExpeditionCitizen")]
        public int IdExpeditionCitizen { get; set; }

        [Column("idExpeditionPart")]
        public int IdExpeditionPart { get; set; }

        [Column("idUser")]
        public int IdUser { get; set; }

        [Column("idExpeditionBag")]
        public int IdExpeditionBag { get; set; }

        [Column("isPreinscrit")]
        public bool IsPreinscrit { get; set; }

        [Column("preinscritJob")]
        public string PreinscritJob { get; set; }

        [Column("preinscritHeroic")]
        public string PreinscritHeroic { get; set; }

        [Column("pdc")]
        public int Pdc { get; set; }

        [Column("isThirsty")]
        public bool? IsThirsty { get; set; }

        public List<ExpeditionCitizenOrderModel> Orders { get; set; }

        public List<ExpeditionBagItemModel> Items { get; set; }
    }
}
