using System;
using System.Collections.Generic;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Contracts;

public interface IExamTermRepository : IBaseRepository<ExamTerm>
{
    Task<IEnumerable<ExamTerm>> ListByCourseAsync(Guid courseId, CancellationToken cancellationToken = default);
    Task<bool> ExistsOutsideSessionAsync(Guid sessionId, DateOnly start, DateOnly end, CancellationToken cancellationToken = default);
    Task<IEnumerable<ExamTerm>> ListWithDetailsAsync(Guid? lecturerId, Guid? studentId, CancellationToken cancellationToken = default);
    Task<(IEnumerable<ExamTerm> Items, int TotalCount)> SearchWithDetailsAsync(
        Guid? lecturerId,
        Guid? studentId,
        Guid? courseId,
        Guid? sessionId,
        Guid? roomId,
        ExamTermStatus? status,
        ExamTermType? type,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ExamTerm>> ListOverlappingAsync(
        DateOnly date,
        TimeOnly start,
        TimeOnly end,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default);
}
