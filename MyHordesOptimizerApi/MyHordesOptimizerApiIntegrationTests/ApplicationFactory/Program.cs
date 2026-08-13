using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Configuration.Impl.ExternalTools;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Controllers.ActionFillters;
using MyHordesOptimizerApi.Providers.Impl;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Impl;
using MyHordesOptimizerApi.Repository.Impl.ExternalTools;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.Configuration;

var builder = WebApplication.CreateBuilder(args);
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

// Requis par ExternalToolsServiceLockingTests (Services.Impl.ExternalTools.ExternalToolsService).
builder.Services.AddSingleton<IGestHordesConfiguration, GestHordesConfiguration>();
builder.Services.AddSingleton<IBigBrothHordesConfiguration, BigBrothHordesConfiguration>();
builder.Services.AddSingleton<IFataMorganaConfiguration, FataMorganaConfiguration>();
builder.Services.AddScoped<IBigBrothHordesRepository, BigBrothHordesRepository>();
builder.Services.AddScoped<IFataMorganaRepository, FataMorganaRepository>();
builder.Services.AddScoped<IGestHordesRepository, GestHordesRepository>();
builder.Services.AddSingleton<TownSyncLock>();
builder.Services.AddScoped<IExternalToolsService, ExternalToolsService>();

// Requis par ExpeditionServiceDayLockTests (Services.Impl.ExpeditionService).
builder.Services.AddScoped<IExpeditionService, ExpeditionService>();

var app = builder.Build();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }
