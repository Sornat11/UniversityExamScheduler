using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;

public class RoomRepository : BaseRepository<Room>, IRoomRepository
{
    public RoomRepository(ApplicationDbContext context) : base(context) { }

    public Task<Room?> GetByRoomNumberAsync(string roomNumber, CancellationToken cancellationToken = default) =>
        _set.FirstOrDefaultAsync(r => r.RoomNumber == roomNumber, cancellationToken);

    public async Task<(IEnumerable<Room> Items, int TotalCount)> SearchAsync(
        string? search,
        string? roomNumber,
        RoomType? type,
        bool? isAvailable,
        int? minCapacity,
        int? maxCapacity,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var normalizedPage = page < 1 ? 1 : page;
        var normalizedPageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 100);

        var query = _set.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(roomNumber))
        {
            var number = roomNumber.Trim().ToLower();
            query = query.Where(r => r.RoomNumber.ToLower() == number);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(r => r.RoomNumber.ToLower().Contains(q));
        }

        if (type.HasValue)
        {
            query = query.Where(r => r.Type == type.Value);
        }

        if (isAvailable.HasValue)
        {
            query = query.Where(r => r.IsAvailable == isAvailable.Value);
        }

        if (minCapacity.HasValue)
        {
            query = query.Where(r => r.Capacity >= minCapacity.Value);
        }

        if (maxCapacity.HasValue)
        {
            query = query.Where(r => r.Capacity <= maxCapacity.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(r => r.RoomNumber)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}
