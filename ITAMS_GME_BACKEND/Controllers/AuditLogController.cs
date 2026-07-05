using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ITAMS_GME_BACKEND.Attributes;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Services;

namespace ITAMS_GME_BACKEND.Controllers
{
    [ApiController]
    [Route("api/audit-logs")]
    [Authorize]
    public class AuditLogController : ControllerBase
    {
        private readonly AuditLogService _auditLogService;

        public AuditLogController(AuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        // GET api/audit-logs?search=&module=&action=&page=1&pageSize=10
        [HttpGet]
        [RequirePermission("AuditLogs", "Read")]
        public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogQueryDto query)
        {
            var result = await _auditLogService.GetAuditLogsAsync(query);
            return Ok(result);
        }

        // GET api/audit-logs/stats — for KPI cards (Malaysia time)
        // MUST be defined BEFORE GetAuditLog({id}) to avoid route conflict
        [HttpGet("stats")]
        [RequirePermission("AuditLogs", "Read")]
        public async Task<IActionResult> GetStats()
        {
            var stats = await _auditLogService.GetStatsAsync();
            return Ok(stats);
        }

        // GET api/audit-logs/{id}
        [HttpGet("{id}")]
        [RequirePermission("AuditLogs", "Read")]
        public async Task<IActionResult> GetAuditLog(int id)
        {
            var log = await _auditLogService.GetAuditLogByIdAsync(id);
            if (log == null)
                return NotFound(new { message = "Audit log not found." });

            return Ok(log);
        }
    }
}