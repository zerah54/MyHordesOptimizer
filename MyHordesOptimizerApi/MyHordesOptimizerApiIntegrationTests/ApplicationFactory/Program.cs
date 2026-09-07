using System.Collections.Generic;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Configuration.Impl.ExternalTools;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Controllers.ActionFillters;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Providers.Impl;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Impl;
using MyHordesOptimizerApi.Repository.Impl.ExternalTools;
using Common.Core.Repository.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApi.Services.Impl.Import;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using MyHordesOptimizerApi.Services.Interfaces.Translations;
using MyHordesOptimizerApiIntegrationTests.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Miroir de MyHordesOptimizerApi/Program.cs : requis par CompressionHttpTests.
builder.Services.AddResponseCompression(options =>
{
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.EnableForHttps = true;
});

// Requis par les tests d'authentification Bearer (ExternalToolsController, C1 de la vague de
// correction sécurité) : sans AddBearerAuthentication + UseAuthentication ci-dessous, aucun jeton
// n'est jamais validé dans cet hôte de test et HttpContext.User reste anonyme quel que soit le
// jeton envoyé — JwtActionFilter peuplerait alors UserInfoProvider.UserId à 0 pour tout le monde.
// Valeurs codées en dur ici (pas de fichier de config dans ce projet de test) : elles n'ont besoin
// que d'être cohérentes entre AuthenticationService.CreateToken (émission) et AddBearerAuthentication
// (validation), les deux lisant la même section "Authentication:Jwt".
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string>
{
    ["Authentication:Jwt:Secret"] = "test-jwt-secret-integration-tests-32-chars-minimum",
    ["Authentication:Jwt:Issuer"] = "mho-integration-tests",
    ["Authentication:Jwt:Audience"] = "mho-integration-tests-audience",
    ["Authentication:Jwt:ValideTimeInMinute"] = "20160"
});
builder.Services.AddBearerAuthentication(builder.Configuration);

// Requis depuis G3 (chiffrement du claim MHO_UserKey) : AuthenticationService/JwtActionFilter
// résolvent désormais IDataProtectionProvider par constructeur.
builder.Services.AddDataProtection();

builder.Services.AddControllers(config =>
{
    config.Filters.Add<ApiExceptionFilter>();
    config.Filters.Add<JwtActionFilter>();
})
    // Sous WebApplicationFactory (dotnet test), Assembly.GetEntryAssembly() renvoie le testhost
    // VSTest — la découverte de contrôleurs par défaut ne scanne alors que CE projet de test, jamais
    // MyHordesOptimizerApi (un assembly référencé, pas l'assembly d'entrée). Sans cette ligne, tous
    // les contrôleurs de l'API (MinesweeperController compris) répondent 404 quel que soit le test.
    .AddApplicationPart(typeof(MyHordesOptimizerApi.Controllers.MinesweeperController).Assembly);
builder.Services.AddHttpClient();
builder.Services.AddTransient<IMyHordesOptimizerSqlConfiguration, MyHordesOptimizerSqlConfiguration>();
builder.Services.AddDbContext<MhoContext>(ServiceLifetime.Transient);

// IUserInfoProvider/AutoMapper : requis par JwtActionFilter/ApiExceptionFilter, sans quoi le
// contrôleur de test lui-même échoue à se construire (voir MinesweeperController).
builder.Services.AddScoped<IUserInfoProvider, UserInfoProvider>();
builder.Services.AddAutoMapper(opt =>
{
    opt.AllowNullDestinationValues = true;
}, typeof(MyHordesOptimizerApi.Controllers.MinesweeperController).Assembly);

// Services testés par HTTP dans MyHordesOptimizerApiIntegrationTests.Controllers.MinesweeperControllerTests
// et MinesweeperLeaderboardTests. Ce Program.cs est un hôte de test minimal, distinct de celui de
// l'API réelle (MyHordesOptimizerApi/Program.cs) — WebApplicationFactory<Program> résout le symbole
// `Program` vers CE fichier, pas vers le vrai. Ajouter ici tout service qu'un nouveau test HTTP
// doit pouvoir résoudre.
builder.Services.AddSingleton<IMinesweeperBoardGenerator, MinesweeperBoardGenerator>();
builder.Services.AddScoped<IMinesweeperService, MinesweeperService>();

// Requis par TownServiceDailyActionTests (Services.Impl.TownService).
builder.Services.AddSingleton<IMyHordesApiConfiguration, MyHordesOptimizerApi.Configuration.Impl.MyHordesApiConfiguration>();
builder.Services.AddScoped<IMyHordesApiRepository, MyHordesApiRepository>();
builder.Services.AddScoped<ITownService, TownService>();

// Requis par UserAccountServiceTests (Services.Impl.UserAccountService).
builder.Services.AddScoped<IUserAccountService, UserAccountService>();

// Requis par NoteServiceTests (Services.Impl.NoteService).
builder.Services.AddScoped<INoteService, NoteService>();

// Requis par ETagCacheHttpTests / ETagVersionServiceTests (mécanisme ETag, famille 1).
builder.Services.AddScoped<IETagVersionService, ETagVersionService>();
// Requis par ETagCacheHttpTests (Controllers.FetcherController, exercé par HTTP pour la 1ère fois ici :
// FetcherController/WishListController demandent IMemoryCache par constructeur pour leur cache référentiels).
builder.Services.AddMemoryCache();

// Requis par ExternalToolsServiceLockingTests (Services.Impl.ExternalTools.ExternalToolsService).
builder.Services.AddSingleton<IGestHordesConfiguration, GestHordesConfiguration>();
builder.Services.AddSingleton<IBigBrothHordesConfiguration, BigBrothHordesConfiguration>();
builder.Services.AddSingleton<IFataMorganaConfiguration, FataMorganaConfiguration>();
builder.Services.AddScoped<IBigBrothHordesRepository, BigBrothHordesRepository>();
builder.Services.AddScoped<IFataMorganaRepository, FataMorganaRepository>();
builder.Services.AddScoped<IGestHordesRepository, GestHordesRepository>();
builder.Services.AddSingleton<TownSyncLock>();
builder.Services.AddSingleton<ReferentialImportLock>();
builder.Services.AddScoped<IExternalToolsService, ExternalToolsService>();

// Requis par ExpeditionServiceDayLockTests (Services.Impl.ExpeditionService).
builder.Services.AddScoped<IExpeditionService, ExpeditionService>();

// Requis par CitizenStateControllerTests (Controllers.CitizenStateController).
builder.Services.AddSingleton<IMyHordesCodeRepository, MyHordesCodeRepository>();
builder.Services.AddScoped<ICitizenItemActionsProvider, CitizenItemActionsProvider>();
builder.Services.AddScoped<ICitizenDayStateEngine, CitizenDayStateEngine>();
builder.Services.AddScoped<ICitizenStateOrderRankingEngine, CitizenStateOrderRankingEngine>();
builder.Services.AddSingleton<IMyHordesScrutateurConfiguration, MyHordesOptimizerApi.Configuration.Impl.MyHordesScrutateurConfiguration>();
builder.Services.AddScoped<IMyHordesFetcherService, MyHordesFetcherService>();

// Requis par AuthenticationControllerFallbackTests (Controllers.AuthenticationController).
builder.Services.AddSingleton<IAuthenticationConfiguration, MyHordesOptimizerApi.Configuration.Impl.AuthenticationConfiguration>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();

// Requis par ExternalToolsControllerAuthTests / ExternalToolsUpdateJobRunnerTownDriftTests
// (Controllers.ExternalToolsController) : le contrôleur résout ces deux services directement,
// jamais exercé par HTTP avant la vague de correction C1/I2.
builder.Services.AddScoped<IMhoHeadersProvider, MhoHeadersProvider>();
builder.Services.AddSingleton<ExternalToolsUpdateJobRunner>();

// Requis par WishListServiceLockingTests (Services.Impl.WishListService).
builder.Services.AddScoped<IWishListService, WishListService>();

// Requis par MyHordesImportServiceLockingTests (Services.Impl.Import.MyHordesImportService).
// webApiRepository/translationsConfiguration/translationService : jamais lus par le chemin exercé
// ici (ImportSingleTownAsync -> MigrateTownId), null! suffit — même astuce que
// MyHordesImportServiceItemsTransactionScopeTests (test unitaire, construction directe).
builder.Services.AddScoped<IWebApiRepository>(_ => null!);
builder.Services.AddSingleton<IMyHordesTranslationsConfiguration>(_ => null!);
builder.Services.AddSingleton<ITranslationService>(_ => null!);
builder.Services.AddScoped<IMyHordesImportService, MyHordesImportService>();

var app = builder.Build();
// Tout premier middleware, comme dans le vrai Program.cs.
app.UseResponseCompression();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }
