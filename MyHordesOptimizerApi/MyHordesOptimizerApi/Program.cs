using Common.Core.Repository.Impl;
using Common.Core.Repository.Interfaces;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Configuration.Impl;
using MyHordesOptimizerApi.Configuration.Impl.ExternalTools;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Controllers.ActionFillters;
using MyHordesOptimizerApi.DiscordBot.Services;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Hubs;
using MyHordesOptimizerApi.Hubs.HubFilters;
using MyHordesOptimizerApi.Providers.Impl;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Impl;
using MyHordesOptimizerApi.Repository.Impl.ExternalTools;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Serilog;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.Estimations;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using MyHordesOptimizerApi.Services.Impl.Import;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Impl.Translations;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using MyHordesOptimizerApi.Services.Interfaces.Translations;
using Sentry;
using Serilog;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Sockets;
using System.Reflection;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Discord;

SentrySdk.Init(options =>
{
    options.Dsn = "https://bac883f9c765169e27cfbbb52f170cb9@o4506962035539968.ingest.us.sentry.io/4508809012314112";
    options.AutoSessionTracking = true;
});

var builder = WebApplication.CreateBuilder(args);

// Bascule vers un MyHordes lancé en local, demandée par le profil de lancement
// « MyHordesOptimizerApi (MyHordes local) ».
// Les valeurs elles-mêmes (URL et clé d'application, qui diffèrent de celles de production)
// sont lues dans la section MyHordesLocalGame d'appsettings.Development.json : ce fichier
// n'est pas versionné, alors que launchSettings.json l'est. Le profil ne porte donc qu'un
// drapeau, et aucun secret ne part dans le dépôt.
if (builder.Environment.IsDevelopment()
    && string.Equals(Environment.GetEnvironmentVariable("MHO_USE_LOCAL_GAME"), "true", StringComparison.OrdinalIgnoreCase))
{
    var localGameSection = builder.Configuration.GetSection("MyHordesLocalGame");
    var localGameOverrides = new Dictionary<string, string?>();
    // Toute clé présente dans la section surcharge son homologue de MyHordes : rien à
    // recompiler pour en ajouter une nouvelle.
    foreach (var setting in localGameSection.GetChildren())
    {
        localGameOverrides[$"MyHordes:{setting.Key}"] = setting.Value;
    }

    if (localGameOverrides.Count > 0)
    {
        builder.Configuration.AddInMemoryCollection(localGameOverrides);
    }
}

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MHO API",
        Version = "v1",
        Description = "API MyHordesOptimizer Swagger"
    });
});

builder.Services.AddCors();
builder.Host.UseSerilog((_, services, configuration) =>
                configuration.ReadFrom.Configuration(builder.Configuration)
                             .Enrich.With(services.GetService<MyHordesOptimizerEnricher>()!));
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();
var myHordesHttpClientBuilder = builder.Services.AddHttpClient(nameof(MyHordesApiRepository), client =>
{
    // 30s et non 10 : MyHordes a déjà connu des épisodes de latence où 10s coupait des appels
    // pourtant en train d'aboutir. L'import des pictos d'un joueur (/json/user avec l'historique
    // par ville) mesure à lui seul ~15s en temps normal. L'appel HTTP est fait hors du verrou de
    // synchronisation, donc allonger ce délai ne bloque pas les autres utilisateurs.
    client.Timeout = TimeSpan.FromSeconds(30);
});

if (builder.Environment.IsDevelopment())
{
    // Permet de viser un MyHordes lancé en local (http://myhordes.localhost) sans toucher au
    // fichier hosts de la machine : les navigateurs résolvent d'eux-mêmes tout nom en
    // `.localhost` vers l'adresse de bouclage (RFC 6761), mais le résolveur de Windows ne le
    // fait pas et .NET s'appuie sur lui — d'où un "Hôte inconnu" au moindre appel.
    // On rétablit donc cette résolution ici, au moment de la connexion uniquement : l'URL
    // demandée n'est pas modifiée, l'en-tête Host reste le nom d'origine, ce dont dépend
    // l'hôte virtuel qui sert le jeu.
    myHordesHttpClientBuilder.ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
    {
        ConnectCallback = async (context, cancellationToken) =>
        {
            var requestedHost = context.DnsEndPoint.Host;
            var targetHost = requestedHost.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                             || requestedHost.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase)
                ? "127.0.0.1"
                : requestedHost;

            var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
            try
            {
                await socket.ConnectAsync(targetHost, context.DnsEndPoint.Port, cancellationToken);
                return new NetworkStream(socket, ownsSocket: true);
            }
            catch
            {
                socket.Dispose();
                throw;
            }
        }
    });
}
builder.Services.AddHttpClient(nameof(GestHordesRepository)).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler()
{
    UseCookies = true,
});
builder.Services.AddAuthorization();
builder.Services.AddControllers(config =>
{
    config.Filters.Add<MhoHeaderActionFilter>();
    config.Filters.Add<ApiExceptionFilter>();
    config.Filters.Add<JwtActionFilter>();
}).AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddAutoMapper(opt =>
{
    opt.AllowNullDestinationValues = true;
}, Assembly.GetAssembly(typeof(Program)));

builder.Services.AddSignalR(options =>
{
    options.AddFilter<JwtHubFilter>();
});

// Providers
builder.Services.AddScoped<IUserInfoProvider, UserInfoProvider>();
builder.Services.AddScoped<IMhoHeadersProvider, MhoHeadersProvider>();

// Admin
builder.Services.AddScoped<AdminService>();

// Configuration
builder.Services.AddSingleton<IMyHordesApiConfiguration, MyHordesApiConfiguration>();
builder.Services.AddSingleton<IGestHordesConfiguration, GestHordesConfiguration>();
builder.Services.AddSingleton<IBigBrothHordesConfiguration, BigBrothHordesConfiguration>();
builder.Services.AddSingleton<IFataMorganaConfiguration, FataMorganaConfiguration>();
builder.Services.AddSingleton<IMyHordesTranslationsConfiguration, MyHordesTranslationsConfiguration>();
builder.Services.AddTransient<IMyHordesOptimizerSqlConfiguration, MyHordesOptimizerSqlConfiguration>();
builder.Services.AddSingleton<IMyHordesScrutateurConfiguration, MyHordesScrutateurConfiguration>();
builder.Services.AddSingleton<IDiscordBotConfiguration, DiscordBotConfiguration>();
builder.Services.AddSingleton<IAuthenticationConfiguration, AuthenticationConfiguration>();

builder.Services.AddSingleton<IMyHordesOptimizerFirebaseConfiguration, MyHordesOptimizerFirebaseConfiguration>();

// Repository
builder.Services.AddSingleton<IWebApiRepository, SimpleWebApiRepository>();
builder.Services.AddSingleton<IMyHordesCodeRepository, MyHordesCodeRepository>();

builder.Services.AddScoped<IMyHordesApiRepository, MyHordesApiRepository>();

builder.Services.AddScoped<IBigBrothHordesRepository, BigBrothHordesRepository>();
builder.Services.AddScoped<IFataMorganaRepository, FataMorganaRepository>();
builder.Services.AddScoped<IGestHordesRepository, GestHordesRepository>();

builder.Services.AddSingleton<IGlossaryRepository, GlossaryRepository>();

builder.Services.AddSingleton<ITranslastionRepository, GitlabWebApiTranslationRepository>();

// Services
builder.Services.AddScoped<IMyHordesFetcherService, MyHordesFetcherService>();
builder.Services.AddScoped<IExternalToolsService, ExternalToolsService>();
builder.Services.AddScoped<IMyHordesImportService, MyHordesImportService>();
// Singleton : porte l'état de l'import global, qui survit à la requête qui l'a déclenché
builder.Services.AddSingleton<ImportJobRunner>();
// Verrou d'écriture des villes : forcément un singleton, il n'a de sens que partagé par tous.
builder.Services.AddSingleton<TownSyncLock>();
builder.Services.AddScoped<IWishListService, WishListService>();
builder.Services.AddSingleton<ITranslationService, TranslationService>();
builder.Services.AddSingleton<IMyHordesRuineService, MyHordesRuineService>();
builder.Services.AddSingleton<IGlossaryService, GlossaryService>();
builder.Services.AddScoped<IMyHordesOptimizerParametersService, MyHordesOptimizerParametersService>();
builder.Services.AddScoped<IMyHordesOptimizerMapService, MyHordesOptimizerMapService>();
builder.Services.AddScoped<IMyHordesOptimizerEstimationService, MyHordesOptimizerEstimationService>();
builder.Services.AddScoped<ICampingService, CampingService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<IExpeditionService, ExpeditionService>();
builder.Services.AddScoped<ITownService, TownService>();
builder.Services.AddScoped<IUserAccountService, UserAccountService>();

// Add the discord client to services
builder.Services.AddSingleton(new DiscordSocketClient(new DiscordSocketConfig
{
    GatewayIntents = GatewayIntents.AllUnprivileged
                     & ~GatewayIntents.GuildScheduledEvents
                     & ~GatewayIntents.GuildInvites,
}));
builder.Services.AddSingleton(sp =>
{
    var client = sp.GetRequiredService<DiscordSocketClient>();
    return new InteractionService(client, new InteractionServiceConfig
    {
        DefaultRunMode = RunMode.Async,
        LogLevel = LogSeverity.Info
    });
});
var jsonLocalizationManager = new JsonLocalizationManager(
        basePath: Path.Combine("DiscordBot", "Assets"),
        fileName: "messages"
    );
builder.Services.AddSingleton<ILocalizationManager>(jsonLocalizationManager);
builder.Services.AddHostedService<InteractionHandlingHostedService>();    // Add the slash command handler
builder.Services.AddHostedService<DiscordStartupHostedService>();         // Add the discord startup service
builder.Services.AddDbContext<MhoContext>(ServiceLifetime.Transient);
builder.Services.AddTransient<MyHordesOptimizerEnricher>();
builder.Services.AddHttpLogging(logging =>
{
    logging.LoggingFields = HttpLoggingFields.All | HttpLoggingFields.RequestQuery;
});

builder.Services.AddBearerAuthentication(builder.Configuration);

builder.Services.AddRateLimiter(options =>
{
    options.AddConcurrencyLimiter(policyName: "MhoInRice", limiterOptions =>
     {
         limiterOptions.PermitLimit = builder.Configuration.GetSection("MhoApiLimit").GetValue<int>("PermitLimit");
         limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
         limiterOptions.QueueLimit = builder.Configuration.GetSection("MhoApiLimit").GetValue<int>("QueueLimit");
     });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
// configure CORS
// En développement seulement, on autorise les origines du jeu et du site lancés en local,
// pour pouvoir tester l'addon contre cette API.
// AllowAnyOrigin est impossible ici : il est incompatible avec AllowCredentials.
var allowedOrigins = app.Environment.IsDevelopment()
    ? new[] { "null", "http://myhordes.localhost", "https://myhordes.localhost", "http://localhost:4200" }
    : new[] { "null" };
app.UseCors(x => x
        .WithOrigins(allowedOrigins)
        .AllowAnyMethod()
        .AllowCredentials()
        .AllowAnyHeader());
app.Use((context, next) =>
{
    context.Request.EnableBuffering();
    return next();
});

// Middleware Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    var swaggerJsonPath = "../swagger/v1/swagger.json";

    c.SwaggerEndpoint(swaggerJsonPath, "MHO API");
    c.RoutePrefix = "docs";
});

app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.UseHttpLogging();

app.MapControllers();
app.MapHub<ExpeditionsHub>("/hub/expeditions");

app.Run();
