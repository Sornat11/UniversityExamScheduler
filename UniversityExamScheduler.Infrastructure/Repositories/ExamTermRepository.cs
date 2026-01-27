using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;

public class ExamTermRepository : BaseRepository<ExamTerm>, IExamTermRepository
{
    public ExamTermRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IEnumerable<ExamTerm>> ListByCourseAsync(Guid courseId, CancellationToken cancellationToken = default) =>
        await _set.Where(t => t.CourseId == courseId).ToListAsync(cancellationToken);

    public Task<bool> ExistsOutsideSessionAsync(Guid sessionId, DateOnly start, DateOnly end, CancellationToken cancellationToken = default)
    {
        return _set.AnyAsync(
            t => t.SessionId == sessionId && (t.Date < start || t.Date > end),
            cancellationToken);
    }

    public async Task<IEnumerable<ExamTerm>> ListWithDetailsAsync(Guid? lecturerId, Guid? studentId, CancellationToken cancellationToken = default)
    {
        IQueryable<ExamTerm> query = _set
            .AsNoTracking()
            .Include(t => t.Exam)
                .ThenInclude(e => e!.Group)
            .Include(t => t.Exam)
                .ThenInclude(e => e!.Lecturer)
            .Include(t => t.Room);

        if (lecturerId.HasValue)
        {
            query = query.Where(t => t.Exam != null && t.Exam!.LecturerId == lecturerId.Value);
        }

        if (studentId.HasValue)
        {
            query = query.Where(t => t.Exam != null && _context.GroupMembers.Any(
                m => m.StudentId == studentId.Value && m.GroupId == t.Exam!.GroupId));
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<(IEnumerable<ExamTerm> Items, int TotalCount)> SearchWithDetailsAsync(
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
        CancellationToken cancellationToken = default)
    {
        var normalizedPage = page < 1 ? 1 : page;
        var normalizedPageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 100);

        IQueryable<ExamTerm> query = _set
            .AsNoTracking()
            .Include(t => t.Exam)
                .ThenInclude(e => e!.Group)
            .Include(t => t.Exam)
                .ThenInclude(e => e!.Lecturer)
            .Include(t => t.Room);

        if (lecturerId.HasValue)
        {
            query = query.Where(t => t.Exam != null && t.Exam.LecturerId == lecturerId.Value);
        }

        if (studentId.HasValue)
        {
            query = query.Where(t => t.Exam != null && _context.GroupMembers.Any(
                m => m.StudentId == studentId.Value && m.GroupId == t.Exam.GroupId));
        }

        if (courseId.HasValue)
        {
            query = query.Where(t => t.CourseId == courseId.Value);
        }

        if (sessionId.HasValue)
        {
            query = query.Where(t => t.SessionId == sessionId.Value);
        }

        if (roomId.HasValue)
        {
            query = query.Where(t => t.RoomId == roomId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (type.HasValue)
        {
            query = query.Where(t => t.Type == type.Value);
        }

        if (dateFrom.HasValue)
        {
            query = query.Where(t => t.Date >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(t => t.Date <= dateTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(t =>
                (t.Exam != null && t.Exam.Name.ToLower().Contains(q)) ||
                (t.Room != null && t.Room.RoomNumber.ToLower().Contains(q)) ||
                (t.Exam != null && t.Exam.Group != null && (
                    t.Exam.Group.Name.ToLower().Contains(q) ||
                    t.Exam.Group.FieldOfStudy.ToLower().Contains(q))) ||
                (t.Exam != null && t.Exam.Lecturer != null && (
                    t.Exam.Lecturer.FirstName.ToLower().Contains(q) ||
                    t.Exam.Lecturer.LastName.ToLower().Contains(q))));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(t => t.Date)
            .ThenBy(t => t.StartTime)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<IReadOnlyList<ExamTerm>> ListOverlappingAsync(
        DateOnly date,
        TimeOnly start,
        TimeOnly end,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<ExamTerm> query = _set
            .AsNoTracking()
            .Include(t => t.Exam)
            .Where(t =>
                t.Date == date &&
                t.StartTime < end &&
                t.EndTime > start &&
                t.Status != ExamTermStatus.Rejected);

        if (excludeId.HasValue)
        {
            query = query.Where(t => t.Id != excludeId.Value);
        }

        return await query.ToListAsync(cancellationToken);
    }
}
