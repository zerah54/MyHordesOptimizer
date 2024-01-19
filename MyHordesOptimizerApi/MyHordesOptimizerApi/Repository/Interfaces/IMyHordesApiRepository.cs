﻿using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using MyHordesOptimizerApi.Models.Map;
using System.Collections.Generic;
using MyHordesOptimizerApi.Configuration.Impl;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesApiRepository
    {
        Dictionary<string, MyHordesItem> GetItems();
        MyHordesMeResponseDto GetMe();
        Dictionary<string, MyHordesApiRuinDto> GetRuins();
        Dictionary<string, MyHordesApiConstructionDto> GetConstructions();
    }
}
