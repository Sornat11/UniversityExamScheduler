using System;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Contracts;

public interface IRoomRepository : IBaseRepository<Room>
{
    Task<Room?> GetByRoomNumberAsync(string roomNumber, CancellationToken cancellationToken = default);
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
}
