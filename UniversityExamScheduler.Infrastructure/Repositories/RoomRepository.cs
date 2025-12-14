using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;

public class RoomRepository : BaseRepository<Room>, IRoomRepository
{
    public RoomRepository(ApplicationDbContext context) : base(context) { }

    public Task<Room?> GetByRoomNumberAsync(string roomNumber, CancellationToken cancellationToken = default) =>
        _set.FirstOrDefaultAsync(r => r.RoomNumber == roomNumber, cancellationToken);
}
