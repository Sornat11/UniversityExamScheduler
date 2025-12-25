using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.Room.Request;
using UniversityExamScheduler.Application.Dtos.Room.Respone;
using UniversityExamScheduler.Application.Services;

namespace UniversityExamScheduler.WebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RoomController : ControllerBase
{
    private readonly IRoomService _roomService;
    private readonly IMapper _mapper;

    public RoomController(IRoomService roomService, IMapper mapper)
    {
        _roomService = roomService;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<IActionResult> AddRoom(CreateRoomDto roomDto, CancellationToken cancellationToken)
    {
        var created = await _roomService.AddAsync(roomDto, cancellationToken);
        var createdDto = _mapper.Map<GetRoomDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, createdDto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var room = await _roomService.GetByIdAsync(id, cancellationToken);
        if (room is null) return NotFound();
        var dto = _mapper.Map<GetRoomDto>(room);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? roomNumber, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(roomNumber))
        {
            var room = await _roomService.GetByRoomNumberAsync(roomNumber, cancellationToken);
            if (room is null) return NotFound();
            var dto = _mapper.Map<GetRoomDto>(room);
            return Ok(dto);
        }

        var rooms = await _roomService.ListAsync(cancellationToken);
        var dtos = _mapper.Map<IEnumerable<GetRoomDto>>(rooms);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRoom(Guid id, UpdateRoomDto roomDto, CancellationToken cancellationToken)
    {
        await _roomService.UpdateAsync(id, roomDto, cancellationToken);
        var updated = await _roomService.GetByIdAsync(id, cancellationToken);
        var dto = _mapper.Map<GetRoomDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRoom(Guid id, CancellationToken cancellationToken)
    {
        await _roomService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
