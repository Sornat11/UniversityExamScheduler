using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.Room.Request;
using UniversityExamScheduler.Application.Dtos.Room.Respone;
using UniversityExamScheduler.Application.Services;
using Microsoft.AspNetCore.Authorization;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.WebApi.Controllers;

[Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
[Route("api/[controller]")]
[ApiController]
public class RoomController(IRoomService roomService, IMapper mapper) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> AddRoom(CreateRoomDto roomDto, CancellationToken cancellationToken)
    {
        var created = await roomService.AddAsync(roomDto, cancellationToken);
        var createdDto = mapper.Map<GetRoomDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, createdDto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var room = await roomService.GetByIdAsync(id, cancellationToken);
        if (room is null) return NotFound();
        var dto = mapper.Map<GetRoomDto>(room);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? roomNumber, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(roomNumber))
        {
            var room = await roomService.GetByRoomNumberAsync(roomNumber, cancellationToken);
            if (room is null) return NotFound();
            var dto = mapper.Map<GetRoomDto>(room);
            return Ok(dto);
        }

        var rooms = await roomService.ListAsync(cancellationToken);
        var dtos = mapper.Map<IEnumerable<GetRoomDto>>(rooms);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRoom(Guid id, UpdateRoomDto roomDto, CancellationToken cancellationToken)
    {
        await roomService.UpdateAsync(id, roomDto, cancellationToken);
        var updated = await roomService.GetByIdAsync(id, cancellationToken);
        var dto = mapper.Map<GetRoomDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRoom(Guid id, CancellationToken cancellationToken)
    {
        await roomService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
