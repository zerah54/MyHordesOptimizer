using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer
{
    public class ItemWithoutRecipeDto
    {
        public string Uid { get; set; }
        public string Img { get; set; }

        /// <summary>
        /// Icône de l'objet cassé, ou null quand le jeu n'en prévoit pas de distincte — auquel cas
        /// c'est <see cref="Img"/> qui s'affiche. 20 objets sur 383 en ont une.
        /// </summary>
        public string ImgBroken { get; set; }
        public IDictionary<string, string> Label { get; set; }
        public int Id { get; set; }
        public CategoryDto Category { get; set; }
        public int Deco { get; set; }
        public bool IsHeaver { get; set; }
        public int Guard { get; set; }
        public IDictionary<string, string> Description { get; set; }

        public IEnumerable<string> Properties { get; set; }
        public IEnumerable<string> Actions { get; set; }

        /// <summary>
        /// Objets permettant d'ouvrir celui-ci. <c>null</c> si ce n'est pas un contenant, liste
        /// vide si contenant sans outil requis, liste peuplée sinon.
        /// </summary>
        public List<ItemSummaryDto> OpenedWith { get; set; }

        /// <summary>Contenants que cet objet permet d'ouvrir. Vide s'il n'en ouvre aucun.</summary>
        public List<ItemSummaryDto> Opens { get; set; } = new List<ItemSummaryDto>();

        /// <summary>
        /// Coût en PA d'une tentative d'ouverture sans outil, quand le contenant a un risque
        /// d'échec (ex. coffre-fort, coffre d'architecte scellé). <c>null</c> si l'ouverture ne
        /// coûte rien ou nécessite un outil.
        /// </summary>
        public int? OpenApCost { get; set; }

        /// <summary>Chance de réussite (0..1) associée à <see cref="OpenApCost"/>.</summary>
        public double? OpenSuccessRate { get; set; }

        /// <summary>
        /// Coût en PC de l'alternative réservée au métier Technicien à l'outil requis, si elle
        /// existe (ex. ouvrir une conserve sans ouvre-boîte). <c>null</c> sinon.
        /// </summary>
        public int? TechnicianOpenCpCost { get; set; }

        public int WishListCount { get; set; }
        public int BankCount { get; set; }

        public double DropRatePraf { get; set; }
        public double DropRateNotPraf { get; set; }

        public ItemWithoutRecipeDto()
        {
            Description = new Dictionary<string, string>();
        }

        public override bool Equals(object obj)
        {
            return obj is ItemDto item &&
                   Id == item.Id;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Id);
        }
    }
}
