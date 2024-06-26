﻿using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Bag;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens
{
    public class CitizenDto
    {
        #region MyHordes

        public int Id { get; set; }

        public string Name { get; set; }

        public bool IsGhost { get; set; }

        public bool Dead { get; set; }

        public string HomeMessage { get; set; }

        public string Avatar { get; set; }

        public string JobName { get; set; }
        public string JobUid { get; set; }

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
