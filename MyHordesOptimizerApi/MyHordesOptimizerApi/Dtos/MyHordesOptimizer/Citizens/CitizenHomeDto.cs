﻿using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CitizenHomeDto
    {
        public CitizenHomeValueDto Content { get; set; }
        public LastUpdateInfoDto? LastUpdateInfo { get; set; }

        public CitizenHomeDto()
        {
            Content = new CitizenHomeValueDto();
        }
    }
}