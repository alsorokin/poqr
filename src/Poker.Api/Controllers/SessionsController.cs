using Microsoft.AspNetCore.Mvc;
using Poker.Api.Contracts;
using Poker.Api.Rooms;

namespace Poker.Api.Controllers;

[ApiController]
[Route("api/sessions")]
public sealed class SessionsController(RoomStore roomStore, ILogger<SessionsController> logger) : ControllerBase
{
    [HttpPost]
    public ActionResult<SessionJoinResponse> CreateSession([FromBody] CreateSessionRequest request)
    {
        var (sessionId, participantId, state) = roomStore.CreateSession(request.ParticipantName);
        logger.LogInformation(
            "HTTP create session succeeded: session {SessionId}, host participant {ParticipantId}.",
            sessionId,
            participantId);
        return Ok(new SessionJoinResponse(sessionId, participantId, state));
    }

    [HttpPost("{sessionId}/join")]
    public ActionResult<SessionJoinResponse> JoinSession(string sessionId, [FromBody] JoinSessionRequest request)
    {
        var result = roomStore.JoinSession(sessionId, request.ParticipantName, request.ParticipantId);
        if (result is null)
        {
            logger.LogWarning("HTTP join failed: session {SessionId} not found.", sessionId);
            return NotFound(new ErrorEnvelope("Session not found."));
        }

        logger.LogInformation(
            "HTTP join succeeded: session {SessionId}, participant {ParticipantId}.",
            sessionId,
            result.Value.ParticipantId);
        return Ok(new SessionJoinResponse(sessionId.ToUpperInvariant(), result.Value.ParticipantId, result.Value.State));
    }

    [HttpGet("{sessionId}")]
    public ActionResult<RoomStateDto> GetState(string sessionId)
    {
        var state = roomStore.GetState(sessionId);
        if (state is null)
        {
            logger.LogWarning("HTTP get state failed: session {SessionId} not found.", sessionId);
            return NotFound(new ErrorEnvelope("Session not found."));
        }

        logger.LogDebug("HTTP get state succeeded: session {SessionId}.", sessionId);
        return Ok(state);
    }
}
