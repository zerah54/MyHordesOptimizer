using System.Collections.Generic;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Controllers.ActionFillters;
using MyHordesOptimizerApi.Exceptions;

namespace MyHordesOptimizerApiUnitTests.Controllers
{
    public class ApiExceptionFilterTests
    {
        private static ObjectResult Run(System.Exception exception)
        {
            var filter = new ApiExceptionFilter(NullLogger<ApiExceptionFilter>.Instance, null!);
            var context = new ExceptionContext(
                new ActionContext(new DefaultHttpContext(), new RouteData(), new ActionDescriptor()),
                new List<IFilterMetadata>())
            { Exception = exception };
            filter.OnException(context);
            return (ObjectResult)context.Result!;
        }

        [Fact]
        public void OnException_MhoBadRequestException_Repond400()
        {
            var result = Run(new MhoBadRequestException("invalide"));

            result.StatusCode.Should().Be(400);
            result.Value.Should().Be("invalide");
        }

        [Fact]
        public void OnException_MhoNotFoundException_Repond404()
        {
            var result = Run(new MhoNotFoundException("absent"));

            result.StatusCode.Should().Be(404);
            result.Value.Should().Be("absent");
        }
    }
}
