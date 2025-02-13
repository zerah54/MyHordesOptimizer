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
using MyHordesOptimizerApi.Services.Impl.Translations;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using MyHordesOptimizerApi.Services.Interfaces.Translations;
using Sentry;
using Serilog;
using System;
using System.IO;
using System.Net.Http;
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

builder.Services.AddCors();
builder.Host.UseSerilog((_, services, configuration) =>
                configuration.ReadFrom.Configuration(builder.Configuration)
                             .Enrich.With(services.GetService<MyHordesOptimizerEnricher>()!));
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();
builder.Services.AddHttpClient(nameof(MyHordesApiRepository), client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});
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

// Action filters
builder.Services.AddScoped<MhoHeaderActionFilter>();

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
app.UseCors(x => x
        .WithOrigins("null")
        .AllowAnyMethod()
        .AllowCredentials()
        .AllowAnyHeader()); // configure CORS
app.Use((context, next) =>
{
    context.Request.EnableBuffering();
    return next();
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
