using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions
{
    public class ExpeditionOrderDto
    {
        public int? Id { get; set; }
        public string? Type { get; set; }
        public string? Text { get; set; }
        public bool? IsDone { get; set; }
        public int? Position { get; set; }
        public int? ExpeditionCitizenId { get; set; }
        public List<int> ExpeditionPartsId { get; set; }
        public List<int> ExpeditionsId { get; set; }

        /// <summary>Case visée, en coordonnées absolues ; null (avec Y) pour une consigne générale.</summary>
        public int? X { get; set; }
        public int? Y { get; set; }

        /// <summary>Consigne typée (cf. ExpeditionOrderKinds) ; null pour un texte libre.</summary>
        public string? Kind { get; set; }
        public int? ItemId { get; set; }
        public int? Quantity { get; set; }
        public string? HeroSkill { get; set; }

        /// <summary>Citoyen à attendre ; null avec « wait » : le groupe.</summary>
        public int? TargetUserId { get; set; }

        /// <summary>Autre expédition du jour à attendre, à la place d'un citoyen.</summary>
        public int? TargetExpeditionId { get; set; }

        /// <summary>Nom de l'expédition à attendre, en lecture seule ; renseigné par GET expeditions/me.</summary>
        public string? TargetExpeditionLabel { get; set; }

        /// <summary>Précision libre d'une consigne typée, en texte brut.</summary>
        public string? Note { get; set; }
    }
}
