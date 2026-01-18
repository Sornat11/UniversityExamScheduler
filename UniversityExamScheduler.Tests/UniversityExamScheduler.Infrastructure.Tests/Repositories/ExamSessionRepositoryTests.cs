using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Infrastructure.Persistence;
using UniversityExamScheduler.Infrastructure.Repositories;

namespace UniversityExamScheduler.Infrastructure.Tests.Repositories;

public class ExamSessionRepositoryTests
{
    [Fact]
    public async Task OverlapsAsync_ReturnsTrue_WhenDatesOverlap()
    {
        await using var context = CreateContext();
        context.ExamSessions.Add(new ExamSession
        {
            Id = Guid.NewGuid(),
            Name = "Winter",
            StartDate = new DateOnly(2025, 1, 1),
            EndDate = new DateOnly(2025, 1, 10)
        });
        await context.SaveChangesAsync();

        var repository = new ExamSessionRepository(context);

        var overlaps = await repository.OverlapsAsync(
            new DateOnly(2025, 1, 5),
            new DateOnly(2025, 1, 6));

        overlaps.Should().BeTrue();
    }

    [Fact]
    public async Task OverlapsAsync_IgnoresExcludedSession()
    {
        var sessionId = Guid.NewGuid();
        await using var context = CreateContext();
        context.ExamSessions.Add(new ExamSession
        {
            Id = sessionId,
            Name = "Winter",
            StartDate = new DateOnly(2025, 1, 1),
            EndDate = new DateOnly(2025, 1, 10)
        });
        await context.SaveChangesAsync();

        var repository = new ExamSessionRepository(context);

        var overlaps = await repository.OverlapsAsync(
            new DateOnly(2025, 1, 5),
            new DateOnly(2025, 1, 6),
            excludeId: sessionId);

        overlaps.Should().BeFalse();
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }
}
