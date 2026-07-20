using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models.Logs;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.Import;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AdminService _adminService;
        private readonly IUserInfoProvider _userInfoProvider;
        private readonly IMyHordesImportService _importService;
        private readonly ITownService _townService;
        private readonly int[] _adminUserIds;

        public AdminController(
            AdminService adminService,
            IUserInfoProvider userInfoProvider,
            IMyHordesImportService importService,
            ITownService townService,
            IConfiguration configuration)
        {
            _adminService = adminService;
            _userInfoProvider = userInfoProvider;
            _importService = importService;
            _townService = townService;
            _adminUserIds = configuration.GetSection("Admin:UserIds").Get<int[]>() ?? [];
        }

        /// <summary>
        /// Returns whether the current authenticated user is an admin.
        /// 401 if no valid token, false if not admin, true if admin.
        /// </summary>
        [HttpGet("is-admin")]
        [Authorize]
        public ActionResult<bool> IsAdmin()
        {
            return Ok(_adminUserIds.Contains(_userInfoProvider.UserId));
        }

        /// <summary>
        /// Returns all dates for which log files exist.
        /// </summary>
        [HttpGet("dates")]
        [Authorize]
        [AdminOnly]
        public ActionResult<List<DateOnly>> GetAvailableDates()
        {
            return Ok(_adminService.GetAvailableDates());
        }

        [HttpPost("import/all")]
        [Authorize]
        [AdminOnly]
        public async Task<ActionResult> ImportAll()
        {
            await _importService.ImportAllAsync();
            return Ok();
        }

        [HttpPost("import/hero-skills")]
        [Authorize]
        [AdminOnly]
        public async Task<ActionResult> ImportHeroSkills()
        {
            await _importService.ImportHeroSkill();
            return Ok();
        }

        [HttpPost("import/causes-of-death")]
        [Authorize]
        [AdminOnly]
        public async Task<ActionResult> ImportCausesOfDeath()
        {
            await _importService.ImportCauseOfDeath();
            return Ok();
        }

        [HttpPost("import/cleanup-types")]
        [Authorize]
        [AdminOnly]
        public ActionResult ImportCleanupTypes()
        {
            _importService.ImportCleanUpTypes();
            return Ok();
        }

        [HttpPost("import/items")]
        [Authorize]
        [AdminOnly]
        public async Task<ActionResult> ImportItems()
        {
            await _importService.ImportItemsAsync();
            return Ok();
        }

        [HttpPost("import/ruins")]
        [Authorize]
        [AdminOnly]
        public ActionResult ImportRuins()
        {
            _importService.ImportRuins();
            return Ok();
        }

        [HttpPost("import/pictos")]
        [Authorize]
        [AdminOnly]
        public ActionResult ImportPictos()
        {
            _importService.ImportPictos();
            return Ok();
        }

        [HttpPost("import/categories")]
        [Authorize]
        [AdminOnly]
        public async Task<ActionResult> ImportCategories()
        {
            await _importService.ImportCategoriesAsync();
            return Ok();
        }

        [HttpPost("import/wishlist-categories")]
        [Authorize]
        [AdminOnly]
        public ActionResult ImportWishlistCategories()
        {
            _importService.ImportWishlistCategorie();
            return Ok();
        }

        [HttpPost("import/default-wishlists")]
        [Authorize]
        [AdminOnly]
        public ActionResult ImportDefaultWishlists()
        {
            _importService.ImportDefaultWishlists();
            return Ok();
        }

        [HttpPost("import/buildings")]
        [Authorize]
        [AdminOnly]
        public async Task<ActionResult> ImportBuildings()
        {
            await _importService.ImportBuildingAsync();
            return Ok();
        }

        [HttpPost("import/jobs")]
        [Authorize]
        [AdminOnly]
        public async Task<ActionResult> ImportJobs()
        {
            await _importService.ImportJobsAsync();
            return Ok();
        }

        [HttpPost("import/towns")]
        [Authorize]
        [AdminOnly]
        public async Task<ActionResult> ImportTowns([FromQuery] int? season = null)
        {
            try
            {
                await _importService.ImportTownsAsync(season);
                return Ok();
            }
            catch (MyHordesApiException ex)
            {
                return StatusCode((int)ex.StatusCode, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, detail = ex.InnerException?.Message, stackTrace = ex.StackTrace });
            }
        }

        // Déjà appelé en fin d'import des villes ; exposé à part pour rattraper les statistiques
        // après une modification directe en base ou un import partiel.
        [HttpPost("users/recompute-stats")]
        [Authorize]
        [AdminOnly]
        public async Task<ActionResult> RecomputeUserStats()
        {
            try
            {
                await _importService.RecomputeUserDirectoryStatsAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        // `limit` borne le nombre de joueurs traités (les jamais rafraîchis d'abord) : le refresh
        // complet se fait ainsi en plusieurs passes plutôt qu'en un appel interminable.
        [HttpPost("users/refresh-names")]
        [Authorize]
        [AdminOnly]
        public async Task<ActionResult> RefreshUserNames([FromQuery] int? limit = null)
        {
            try
            {
                await _importService.RefreshUserNamesAsync(limit);
                return Ok();
            }
            catch (MyHordesApiException ex)
            {
                return StatusCode((int)ex.StatusCode, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        [HttpPost("towns/{townId}/import")]
        [Authorize]
        [AdminOnly]
        public async Task<ActionResult> ImportSingleTown([FromRoute] int townId)
        {
            try
            {
                await _importService.ImportSingleTownAsync(townId);
                return Ok();
            }
            catch (MyHordesApiException ex)
            {
                return StatusCode((int)ex.StatusCode, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        [HttpDelete("towns/{townId}")]
        [Authorize]
        [AdminOnly]
        public ActionResult DeleteTown([FromRoute] int townId)
        {
            try
            {
                _townService.DeleteTown(townId);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        [HttpPost("seasons/{season}/finish")]
        [Authorize]
        [AdminOnly]
        public ActionResult FinishSeason([FromRoute] int season)
        {
            _townService.FinishSeason(season);
            return Ok();
        }

        [HttpPost("seasons/{season}/unfinish")]
        [Authorize]
        [AdminOnly]
        public ActionResult UnfinishSeason([FromRoute] int season)
        {
            _townService.UnfinishSeason(season);
            return Ok();
        }

        /// <summary>
        /// Returns paginated log entries for a given date.
        /// </summary>
        [HttpGet("logs")]
        [Authorize]
        [AdminOnly]
        public ActionResult<LogPageResult> GetLogs(
            [FromQuery] DateOnly date,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 200,
            [FromQuery] string? level = null,
            [FromQuery] string? correlationId = null,
            [FromQuery] string? search = null)
        {
            if (page < 1) page = 1;
            if (pageSize is < 1 or > 1000) pageSize = 200;

            return Ok(_adminService.GetLogs(date, page, pageSize, level, correlationId, search));
        }
    }
}
