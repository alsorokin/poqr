using Microsoft.AspNetCore.Mvc;
using Poker.Api.Contracts;
using Poker.Api.Rooms;

namespace Poker.Api.Controllers;

[ApiController]
[Route("api/sessions")]
public sealed class SessionsController(RoomStore roomStore) : ControllerBase
{
    [HttpPost]
    public ActionResult<SessionJoinResponse> CreateSession([FromBody] CreateSessionRequest request)
    {
        var (sessionId, participantId, state) = roomStore.CreateSession(request.ParticipantName);
        return Ok(new SessionJoinResponse(sessionId, participantId, state));
    }

    [HttpPost("{sessionId}/join")]
    public ActionResult<SessionJoinResponse> JoinSession(string sessionId, [FromBody] JoinSessionRequest request)
    {
        var result = roomStore.JoinSession(sessionId, request.ParticipantName, request.ParticipantId);
        if (result is null)
        {
            return NotFound(new ErrorEnvelope("Session not found."));
        }

        return Ok(new SessionJoinResponse(sessionId.ToUpperInvariant(), result.Value.ParticipantId, result.Value.State));
    }

    [HttpGet("{sessionId}")]
    public ActionResult<RoomStateDto> GetState(string sessionId)
    {
        var state = roomStore.GetState(sessionId);
        if (state is null)
        {
            return NotFound(new ErrorEnvelope("Session not found."));
        }

        return Ok(state);
    }
}
