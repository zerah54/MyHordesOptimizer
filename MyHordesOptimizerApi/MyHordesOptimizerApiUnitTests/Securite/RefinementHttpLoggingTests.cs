using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.HttpLogging;
using MyHordesOptimizerApi.Controllers;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Securite
{
    /// <summary>Le corps de POST Refinement porte des seeds : HttpLogging ne doit jamais le journaliser, quel que soit son niveau configuré.</summary>
    public class RefinementHttpLoggingTests
    {
        [Fact]
        public void Post_refinement_excludes_the_request_body_from_http_logging()
        {
            var attribute = typeof(AttaqueEstimationController).GetMethod(nameof(AttaqueEstimationController.PostRefinement))!
                .GetCustomAttribute<HttpLoggingAttribute>();

            attribute.Should().NotBeNull();
            attribute!.LoggingFields.HasFlag(HttpLoggingFields.RequestBody).Should().BeFalse();
        }
    }
}
