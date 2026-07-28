using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Bag;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens
{
    public class CitizenDto
    {
        #region MyHordes

        public int Id { get; set; }

        public string Name { get; set; }

        public bool Dead { get; set; }

        public string HomeMessage { get; set; }

        public string Avatar { get; set; }

        public string JobName { get; set; }
        public string JobUid { get; set; }

        /// <summary>
        /// Rôles de ville portés par ce citoyen, parmi <c>shaman</c>, <c>guide</c> et <c>cata</c> —
        /// vide s'il n'en porte aucun.
        /// </summary>
        /// <remarks>
        /// Une LISTE, et non une valeur unique : le jeu garantit un seul porteur par rôle, pas un
        /// seul rôle par porteur. Rien n'empêche un même citoyen d'être à la fois Chaman et Guide
        /// de l'Outre-Monde.
        /// </remarks>
        public List<string> TownRoles { get; set; } = new List<string>();

        public int X { get; set; }

        public int Y { get; set; }

        #endregion

        public int NombreJourHero { get; set; }

        public BagDto Bag { get; set; }
        public CitizenHomeDto Home { get; set; }
        public CitizenStatusDto Status { get; set; }
        public CitizenActionsHeroic ActionsHeroic { get; set; }
        public CitizenChamanicDetailDto ChamanicDetail { get; set; }
        public CadaverDto Cadaver { get; set; }
        public List<BathDto> Baths { get; set; }

        public bool IsShunned { get; set; }

        public CitizenDto()
        {
            Bag = new BagDto();
            Cadaver = new CadaverDto();
        }
    }
}
