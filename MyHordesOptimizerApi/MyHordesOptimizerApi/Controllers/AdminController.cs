using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Attributes;
using MyHordesOptimizerApi.Models.Logs;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AdminService _adminService;
        private readonly IUserInfoProvider _userInfoProvider;
        private readonly int[] _adminUserIds;

        public AdminController(
            AdminService adminService,
            IUserInfoProvider userInfoProvider,
            IConfiguration configuration)
        {
            _adminService = adminService;
            _userInfoProvider = userInfoProvider;
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
