using System.Collections.Generic;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.MappingProfiles.Towns;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Items;
using Newtonsoft.Json;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    public class MyHordesItemResolverTests
    {
        private static readonly Item Water = new() { IdItem = 1, MhId = 101, Uid = "water_#00" };
        private static readonly Item Bread = new() { IdItem = 2, MhId = 102, Uid = "bread_#00" };
        private static readonly Item NoMhId = new() { IdItem = 3, Uid = "wood_bad_#00" };

        private static MyHordesItemResolver NewResolver() => new(new List<Item> { Water, Bread, NoMhId });

        [Fact]
        public void LUuidPrimeSurLId()
        {
            NewResolver().Resolve(new MyHordesItem { Uuid = "water_#00", Id = 102 }).Should().BeSameAs(Water);
        }

        [Fact]
        public void SansUuidOnRetombeSurLeMhId()
        {
            NewResolver().Resolve(new MyHordesItem { Id = 102 }).Should().BeSameAs(Bread);
        }

        [Fact]
        public void UnUuidInconnuNeRetombePasSurLId()
        {
            NewResolver().Resolve(new MyHordesItem { Uuid = "new_item_#00", Id = 101 }).Should().BeNull();
        }

        [Fact]
        public void LUuidEstInsensibleALaCasse()
        {
            NewResolver().Resolve(new MyHordesItem { Uuid = "WATER_#00" }).Should().BeSameAs(Water);
        }

        [Fact]
        public void LeMhIdExplicitePrimeSurLIdItemDUneAutreLigne()
        {
            var explicitMhId = new Item { IdItem = 7, MhId = 3, Uid = "drug_#00" };
            new MyHordesItemResolver(new List<Item> { NoMhId, explicitMhId })
                .Resolve(new MyHordesItem { Id = 3 }).Should().BeSameAs(explicitMhId);
        }

        [Fact]
        public void SansMhIdLIdMhoSertDeCle()
        {
            NewResolver().Resolve(new MyHordesItem { Id = 3 }).Should().BeSameAs(NoMhId);
        }

        [Fact]
        public void UnObjetInconnuNeResoutRien()
        {
            NewResolver().Resolve(new MyHordesItem { Uuid = "new_item_#00", Id = 999 }).Should().BeNull();
            NewResolver().Resolve(new MyHordesItem()).Should().BeNull();
        }

        [Fact]
        public void LUuidEstLuDepuisLeJson()
        {
            JsonConvert.DeserializeObject<MyHordesItem>("{\"uid\":\"water\",\"uuid\":\"water_#00\",\"id\":101}")!
                .Uuid.Should().Be("water_#00");
        }

        [Fact]
        public void LaBanqueEstResolueParUuid()
        {
            var mapper = new MapperConfiguration(cfg => cfg.AddProfile<TownMappingProfile>(), NullLoggerFactory.Instance).CreateMapper();

            var bankItem = mapper.Map<TownBankItem>(new MyHordesItem { Uuid = "bread_#00", Id = 101, Count = 4 },
                opts => opts.SetAllItems(new List<Item> { Water, Bread }));

            bankItem.IdItem.Should().Be(2);
            bankItem.IdItemNavigation.Should().BeSameAs(Bread);
        }
    }
}
