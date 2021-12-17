using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MyHordesFetcherController : ControllerBase
    {

        private readonly ILogger<MyHordesFetcherController> _logger;
        private readonly IMyHordesFetcherService _myHordesFetcherService;

        public MyHordesFetcherController(ILogger<MyHordesFetcherController> logger, IMyHordesFetcherService myHordesFetcherService)
        {
            _logger = logger;
            _myHordesFetcherService = myHordesFetcherService;
        }

        [HttpGet]
        [Route("Citizens")]
        public IEnumerable<Citizen> GetCitizens()
        {
            var list = new List<Citizen>();
            list.Add(new Citizen() { Nom = "test" });
            return list;
        }

        [HttpGet]
        [Route("Items")]
        public IEnumerable<Item> GetItems()
        {
            var items = _myHordesFetcherService.GetItems();
            return items;
        }
    }
}
