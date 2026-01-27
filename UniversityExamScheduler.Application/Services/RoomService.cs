using System;
using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.Room.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Services;

public interface IRoomService
{
    Task<Room?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Room?> GetByRoomNumberAsync(string roomNumber, CancellationToken cancellationToken = default);
    Task<IEnumerable<Room>> ListAsync(CancellationToken cancellationToken = default);
    Task<(IEnumerable<Room> Items, int TotalCount)> SearchAsync(
        string? search,
        string? roomNumber,
        RoomType? type,
        bool? isAvailable,
        int? minCapacity,
        int? maxCapacity,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<Room> AddAsync(CreateRoomDto roomDto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateRoomDto roomDto, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
}

public class RoomService : IRoomService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public RoomService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public Task<Room?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _uow.Rooms.GetByIdAsync(id);

    public Task<Room?> GetByRoomNumberAsync(string roomNumber, CancellationToken cancellationToken = default) =>
        _uow.Rooms.GetByRoomNumberAsync(roomNumber, cancellationToken);

    public Task<IEnumerable<Room>> ListAsync(CancellationToken cancellationToken = default) =>
        _uow.Rooms.ListAsync(cancellationToken);

    public Task<(IEnumerable<Room> Items, int TotalCount)> SearchAsync(
        string? search,
        string? roomNumber,
        RoomType? type,
        bool? isAvailable,
        int? minCapacity,
        int? maxCapacity,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default) =>
        _uow.Rooms.SearchAsync(search, roomNumber, type, isAvailable, minCapacity, maxCapacity, page, pageSize, cancellationToken);

    public async Task<Room> AddAsync(CreateRoomDto roomDto, CancellationToken cancellationToken = default)
    {
        var room = _mapper.Map<Room>(roomDto);
        if (room.Id == Guid.Empty) room.Id = Guid.NewGuid();

        var existing = await _uow.Rooms.GetByRoomNumberAsync(room.RoomNumber, cancellationToken);
        if (existing is not null)
            throw new EntityAlreadyExistsException($"Room '{room.RoomNumber}' already exists.");

        await _uow.Rooms.AddAsync(room, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        return room;
    }

    public async Task UpdateAsync(Guid id, UpdateRoomDto roomDto, CancellationToken cancellationToken = default)
    {
        var room = await _uow.Rooms.GetByIdAsync(id);
        if (room is null)
            throw new EntityNotFoundException($"Room with ID '{id}' not found.");

        _mapper.Map(roomDto, room);
        await _uow.Rooms.UpdateAsync(room, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var room = await _uow.Rooms.GetByIdAsync(id);
        if (room is null)
            throw new EntityNotFoundException($"Room with ID '{id}' not found.");

        await _uow.Rooms.RemoveAsync(room, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }
}
