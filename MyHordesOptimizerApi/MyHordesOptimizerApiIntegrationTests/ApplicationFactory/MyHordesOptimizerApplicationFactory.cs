using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Repository.Impl;

namespace MyHordesOptimizerApiIntegrationTests.ApplicationFactory
{
    public class MyHordesOptimizerApplicationFactory : WebApplicationFactory<Program>
    {

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder
               //.UseSolutionRelativeContentRoot("./MyHordesOptimizerApi") // Needed to make the test to work
               .UseTestServer() // Ensure test server usage
               .ConfigureAppConfiguration((builderContext, config) =>
               {
                   //var env = builderContext.HostingEnvironment;
                   //config.AddJsonFile($"{env.ContentRootPath}/../MyHordesOptimizerApiIntegrationTests/appsettings.json", optional: false, reloadOnChange: true)
                   //    .Build();
               })
                .ConfigureTestServices(services =>
                {
                });
        }

    }
}
