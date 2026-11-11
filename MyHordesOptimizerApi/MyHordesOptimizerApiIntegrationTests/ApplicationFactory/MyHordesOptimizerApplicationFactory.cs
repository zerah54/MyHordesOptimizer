using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection.Extensions;
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
                    // AddDbContext fait un TryAdd des options : sans ce retrait, la configuration
                    // de Program.cs l'emporte et l'interceptor n'est jamais attaché.
                    services.RemoveAll<DbContextOptions<MhoContext>>();
                    services.AddDbContext<MhoContext>(options => options.AddInterceptors(_cleanupInterceptor), ServiceLifetime.Transient);
                });
        }

        // UserInfoProvider.UserId vaut 0 tant qu'aucun JWT n'est lu : les services écrivent alors
        // LastUpdateInfo.idUser = 0 (FK vers Users). Cette ligne technique est la seule laissée en base :
        // jamais supprimée, car plusieurs classes de tests s'exécutent en parallèle et en dépendent.
        protected override IHost CreateHost(IHostBuilder builder)
        {
            var host = base.CreateHost(builder);
            using var scope = host.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            context.Database.ExecuteSqlRaw("INSERT IGNORE INTO `Users` (`idUser`, `name`, `nbTownsPlayed`) VALUES (0, 'mho-tests-default-user', 0)");
            return host;
        }

        // xUnit 2.6 démonte les fixtures via IDisposable.Dispose, jamais DisposeAsync : le nettoyage
        // doit donc aussi s'exécuter ici (idempotent, la liste tracée est vidée au premier passage).
        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                CleanupAsync().GetAwaiter().GetResult();
            }
            base.Dispose(disposing);
        }

        public override async ValueTask DisposeAsync()
        {
            await CleanupAsync();
            await base.DisposeAsync();
        }

        private Task CleanupAsync()
        {
            return _cleanupInterceptor.CleanupAsync(() =>
            {
                var scope = Services.CreateScope();
                return Task.FromResult<DbContext>(scope.ServiceProvider.GetRequiredService<MhoContext>());
            });
        }
    }
}
