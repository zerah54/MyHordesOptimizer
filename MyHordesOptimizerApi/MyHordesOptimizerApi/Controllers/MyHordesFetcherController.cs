using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MyHordesFetcherController : AbstractMyHordesOptimizerControllerBase
    {

        private readonly IMyHordesFetcherService _myHordesFetcherService;

        public MyHordesFetcherController(ILogger<MyHordesFetcherController> logger,
            IMyHordesFetcherService myHordesFetcherService,
            IUserKeyProvider userKeyProvider) : base(logger, userKeyProvider)
        {
            _myHordesFetcherService = myHordesFetcherService;
        }

        [HttpGet]
        [Route("Citizens")]
        public ActionResult<IEnumerable<Citizen>> GetCitizens(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            UserKeyProvider.UserKey = userKey;
            var list = new List<Citizen>();
            list.Add(new Citizen() { Nom = "test" });
            return list;
        }

        [HttpGet]
        [Route("Items")]
        public ActionResult<IEnumerable<Item>> GetItems(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            UserKeyProvider.UserKey = userKey;
            var items = _myHordesFetcherService.GetItems().ToList();
            return items;
        }
    }
}
