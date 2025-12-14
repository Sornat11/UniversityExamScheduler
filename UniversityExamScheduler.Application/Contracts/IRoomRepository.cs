using System;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Contracts;

public interface IRoomRepository : IBaseRepository<Room>
{
    Task<Room?> GetByRoomNumberAsync(string roomNumber, CancellationToken cancellationToken = default);
}
