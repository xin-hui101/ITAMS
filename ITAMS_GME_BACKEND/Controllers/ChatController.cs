using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Services;

namespace ITAMS_GME_BACKEND.Controllers
{
    [ApiController]
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly ChatService _chatService;

        public ChatController(ChatService chatService)
        {
            _chatService = chatService;
        }

        // POST api/chat
        [HttpPost]
        public async Task<IActionResult> Chat([FromBody] ChatRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest(new { message = "Message is required." });

            var reply = await _chatService.AskAsync(request.Message);
            return Ok(new ChatResponseDto { Reply = reply });
        }
    }
}