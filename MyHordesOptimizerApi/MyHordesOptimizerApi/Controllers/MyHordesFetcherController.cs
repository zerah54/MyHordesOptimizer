using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MyHordesFetcherController : ControllerBase
    {

        private readonly ILogger<MyHordesFetcherController> _logger;
        private readonly IMyHordesFetcherService _myHordesFetcherService;
        private readonly IUserKeyProvider _userKeyProvider;

        public MyHordesFetcherController(ILogger<MyHordesFetcherController> logger, 
            IMyHordesFetcherService myHordesFetcherService,
            IUserKeyProvider userKeyProvider)
        {
            _logger = logger;
            _myHordesFetcherService = myHordesFetcherService;
            _userKeyProvider = userKeyProvider;
        }

        [HttpGet]
        [Route("Citizens")]
        public IEnumerable<Citizen> GetCitizens(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                throw new ArgumentException($"{nameof(userKey)} cannot be empty");
            }
            _userKeyProvider.UserKey = userKey;
            var list = new List<Citizen>();
            list.Add(new Citizen() { Nom = "test" });
            return list;
        }

        [HttpGet]
        [Route("Items")]
        public IEnumerable<Item> GetItems(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                throw new ArgumentException($"{nameof(userKey)} cannot be empty");
            }
            _userKeyProvider.UserKey = userKey;
            var items = _myHordesFetcherService.GetItems();
            return items;
        }
    }
}
