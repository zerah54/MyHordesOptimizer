using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;

namespace MyHordesOptimizerApiIntegrationTests.ApplicationFactory
{
    public class MyHordesOptimizerApplicationFactory : WebApplicationFactory<Program>
    {
        // Toute ligne insérée en base pendant les tests de cette classe (MHO_BETA, partagée avec le
        // dev local — voir project_wiki_items_null_label_crash) est tracée par cet interceptor et
        // supprimée dans DisposeAsync. Une transaction ambiante aurait été plus simple mais casse
        // ImportItemsAsync (BeginTransaction imbriqué) et les *LockingTests (connexions concurrentes
        // qui doivent réellement se bloquer) — voir la revue du 2026-09-09.
        private readonly TestWriteCleanupInterceptor _cleanupInterceptor = new();

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
                    services.AddDbContext<MhoContext>(options => options.AddInterceptors(_cleanupInterceptor));
                });
        }

        public override async ValueTask DisposeAsync()
        {
            await _cleanupInterceptor.CleanupAsync(async () =>
            {
                var scope = Services.CreateScope();
                return scope.ServiceProvider.GetRequiredService<MhoContext>();
            });
            await base.DisposeAsync();
        }
    }
}
