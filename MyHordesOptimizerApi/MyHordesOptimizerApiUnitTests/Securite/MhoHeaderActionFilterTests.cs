using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Controllers.ActionFillters;
using MyHordesOptimizerApi.Providers.Impl;
using System.Collections.Generic;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Securite
{
    /// <summary>Les origines de confiance passent sans contrôle de version minimale de l'addon ; toute autre origine y est soumise.</summary>
    public class MhoHeaderActionFilterTests
    {
        private sealed class FakeController
        {
            public void Act() { }
        }

        private static ActionExecutingContext Execute(string origin)
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers["Mho-Origin"] = origin;
            httpContext.Request.Headers["Mho-Addon-Version"] = "1.0.0";

            var descriptor = new ControllerActionDescriptor
            {
                ActionName = "Act",
                MethodInfo = typeof(FakeController).GetMethod(nameof(FakeController.Act))!
            };
            var context = new ActionExecutingContext(
                new ActionContext(httpContext, new RouteData(), descriptor),
                new List<IFilterMetadata>(),
                new Dictionary<string, object?>(),
                new FakeController());

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?> { ["MhoVersionControl:FakeController:Act"] = "99.0.0" })
                .Build();

            new MhoHeaderActionFilter(new MhoHeadersProvider(), configuration).OnActionExecuting(context);
            return context;
        }

        [Theory]
        [InlineData("website")]
        [InlineData("zen-hordes")]
        [InlineData("gh-updater")]
        public void OnActionExecuting_OrigineDeConfiance_PasseSansControleDeVersion(string origin)
        {
            Execute(origin).Result.Should().BeNull();
        }

        [Fact]
        public void OnActionExecuting_OrigineInconnue_EstSoumiseAuControleDeVersion()
        {
            Execute("autre").Result.Should().BeOfType<BadRequestObjectResult>();
        }
    }
}
