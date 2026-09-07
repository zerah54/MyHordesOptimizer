using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using MyHordesOptimizerApi.Controllers.ActionFillters;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiUnitTests.Expeditions.Fakes;
using MyHordesOptimizerApiUnitTests.Http.Fakes;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Http
{
    /// <summary>
    /// Mécanisme ETag générique (famille 1, voir .superpowers/sdd/2026-09-03-session-lifecycle) —
    /// filtre testé isolément, sans hôte HTTP ni BDD : IETagVersionService est un fake entièrement
    /// contrôlé par le test, le service métier de l'action n'existe même pas dans ce test. "next"
    /// représente TOUT ce qui suit (le corps de l'action, donc le service qu'elle appelle) : le
    /// compter à 0 sur un 304 prouve structurellement que ce service n'est jamais invoqué.
    /// </summary>
    public class ETagCacheFilterTests
    {
        private static (ActionExecutingContext context, HttpContext httpContext) NewExecutingContext(
            IDictionary<string, object?>? actionArguments = null, string? ifNoneMatch = null)
        {
            var httpContext = new DefaultHttpContext();
            if (ifNoneMatch is not null)
            {
                httpContext.Request.Headers["If-None-Match"] = ifNoneMatch;
            }
            var actionContext = new ActionContext(httpContext, new RouteData(), new ControllerActionDescriptor());
            var context = new ActionExecutingContext(
                actionContext,
                new List<IFilterMetadata>(),
                actionArguments ?? new Dictionary<string, object?>(),
                controller: new object());
            return (context, httpContext);
        }

        private static (ActionExecutionDelegate next, Func<int> callCount) NewNext(ActionContext actionContext)
        {
            var count = 0;
            Task<ActionExecutedContext> Next()
            {
                count++;
                var executed = new ActionExecutedContext(actionContext, new List<IFilterMetadata>(), controller: new object())
                {
                    Result = new OkObjectResult("payload")
                };
                return Task.FromResult(executed);
            }
            return (Next, () => count);
        }

        [Fact]
        public async Task IfNoneMatchCorrespondALaVersionCourante_CourtCircuiteEn304SansAppelerNext()
        {
            var (context, httpContext) = NewExecutingContext();
            var versionService = new FakeETagVersionService { Compute = (_, _, _) => "v1" };
            var etag = ComputeExpectedETag(userId: 0, rawVersion: "v1");
            httpContext.Request.Headers["If-None-Match"] = etag;
            var filter = new ETagCacheFilter(ETagResource.Bank, "townId", versionService, new FakeUserInfoProvider());
            var (next, callCount) = NewNext(context);

            await filter.OnActionExecutionAsync(context, next);

            callCount().Should().Be(0, "un 304 ne doit jamais exécuter le corps de l'action (donc jamais le service sous-jacent)");
            context.Result.Should().BeOfType<StatusCodeResult>().Which.StatusCode.Should().Be(StatusCodes.Status304NotModified);
            httpContext.Response.Headers["ETag"].ToString().Should().Be(etag);
            httpContext.Response.Headers["Cache-Control"].ToString().Should().Be("private, must-revalidate");
            httpContext.Response.Headers["Vary"].ToString().Should().Contain("Authorization");
        }

        [Theory]
        [InlineData(null)]
        [InlineData("\"some-stale-value\"")]
        public async Task IfNoneMatchAbsentOuPerime_ExecuteLActionEtPoseLesEnTetes(string? ifNoneMatch)
        {
            var (context, httpContext) = NewExecutingContext(ifNoneMatch: ifNoneMatch);
            var versionService = new FakeETagVersionService { Compute = (_, _, _) => "v1" };
            var filter = new ETagCacheFilter(ETagResource.Bank, "townId", versionService, new FakeUserInfoProvider());
            var (next, callCount) = NewNext(context);

            await filter.OnActionExecutionAsync(context, next);

            callCount().Should().Be(1);
            context.Result.Should().BeNull();
            httpContext.Response.Headers["ETag"].ToString().Should().NotBeNullOrEmpty();
            httpContext.Response.Headers["Cache-Control"].ToString().Should().Be("private, must-revalidate");
            httpContext.Response.Headers["Vary"].ToString().Should().Contain("Authorization");
        }

        [Fact]
        public async Task AucuneVersionDisponible_ExecuteLActionSansPoserAucunEnTete()
        {
            // Ex. Fetcher/Bank sans townId (synchro MyHordes en écriture) : pas de version bon marché,
            // le filtre doit s'effacer complètement plutôt que d'inventer un ETag.
            var (context, httpContext) = NewExecutingContext();
            var versionService = new FakeETagVersionService { Compute = (_, _, _) => null };
            var filter = new ETagCacheFilter(ETagResource.Bank, "townId", versionService, new FakeUserInfoProvider());
            var (next, callCount) = NewNext(context);

            await filter.OnActionExecutionAsync(context, next);

            callCount().Should().Be(1);
            httpContext.Response.Headers.ContainsKey("ETag").Should().BeFalse();
            httpContext.Response.Headers.ContainsKey("Cache-Control").Should().BeFalse();
            httpContext.Response.Headers.ContainsKey("Vary").Should().BeFalse();
        }

        [Fact]
        public async Task DeuxUtilisateursDifferents_MemeVersionBrute_NePartagentJamaisLEtag()
        {
            var versionService = new FakeETagVersionService { Compute = (_, _, _) => "same-raw-version" };

            var (contextA, httpContextA) = NewExecutingContext();
            var filterA = new ETagCacheFilter(ETagResource.Citizens, "townId", versionService, new FakeUserInfoProvider { UserId = 111 });
            await filterA.OnActionExecutionAsync(contextA, NewNext(contextA).next);

            var (contextB, httpContextB) = NewExecutingContext();
            var filterB = new ETagCacheFilter(ETagResource.Citizens, "townId", versionService, new FakeUserInfoProvider { UserId = 222 });
            await filterB.OnActionExecutionAsync(contextB, NewNext(contextB).next);

            var etagA = httpContextA.Response.Headers["ETag"].ToString();
            var etagB = httpContextB.Response.Headers["ETag"].ToString();
            etagA.Should().NotBeNullOrEmpty();
            etagB.Should().NotBeNullOrEmpty();
            etagA.Should().NotBe(etagB, "l'id utilisateur est plié dans le hash : deux utilisateurs ne doivent jamais partager un ETag");
            httpContextA.Response.Headers["Vary"].ToString().Should().Contain("Authorization");
            httpContextB.Response.Headers["Vary"].ToString().Should().Contain("Authorization");
        }

        [Fact]
        public async Task IdParamNameVide_NeLitAucunArgumentEtInterrogeLeServiceAvecIdNull()
        {
            // Cas des notes "mine" (town/mine, user/mine) : pas de paramètre d'identifiant, seul
            // l'utilisateur courant scope la version.
            (ETagResource, int?, int)? seenArgs = null;
            var (context, _) = NewExecutingContext(actionArguments: new Dictionary<string, object?> { ["townId"] = 42 });
            var versionService = new FakeETagVersionService
            {
                Compute = (resource, id, userId) => { seenArgs = (resource, id, userId); return null; }
            };
            var filter = new ETagCacheFilter(ETagResource.NoteMyTown, "", versionService, new FakeUserInfoProvider { UserId = 7 });

            await filter.OnActionExecutionAsync(context, NewNext(context).next);

            seenArgs.Should().Be((ETagResource.NoteMyTown, (int?)null, 7));
        }

        private static string ComputeExpectedETag(int userId, string rawVersion)
        {
            var hash = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes($"{userId}:{rawVersion}"));
            return $"\"{Convert.ToHexString(hash)}\"";
        }
    }
}
