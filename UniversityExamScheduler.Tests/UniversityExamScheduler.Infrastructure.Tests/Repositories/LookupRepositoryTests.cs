using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Infrastructure.Persistence;
using UniversityExamScheduler.Infrastructure.Repositories;

namespace UniversityExamScheduler.Infrastructure.Tests.Repositories;

public class RoomRepositoryTests
{
    [Fact]
    public async Task GetByRoomNumberAsync_ReturnsRoom()
    {
        await using var context = CreateContext();
        var room = new Room
        {
            Id = Guid.NewGuid(),
            RoomNumber = "A1",
            Capacity = 10,
            Type = RoomType.Lecture
        };
        context.Rooms.Add(room);
        await context.SaveChangesAsync();

        var repository = new RoomRepository(context);

        var result = await repository.GetByRoomNumberAsync("A1");

        result.Should().NotBeNull();
        result!.Id.Should().Be(room.Id);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }
}

public class StudentGroupRepositoryTests
{
    [Fact]
    public async Task GetByNameAsync_ReturnsGroup()
    {
        await using var context = CreateContext();
        var group = new StudentGroup
        {
            Id = Guid.NewGuid(),
            Name = "G1",
            FieldOfStudy = "CS",
            StudyType = StudyType.Stacjonarne,
            Semester = 1,
            StarostaId = Guid.NewGuid()
        };
        context.StudentGroups.Add(group);
        await context.SaveChangesAsync();

        var repository = new StudentGroupRepository(context);

        var result = await repository.GetByNameAsync("G1");

        result.Should().NotBeNull();
        result!.Id.Should().Be(group.Id);
    }

    [Fact]
    public async Task IsMemberAsync_ReturnsTrue_ForExistingMember()
    {
        var studentId = Guid.NewGuid();
        var groupId = Guid.NewGuid();
        await using var context = CreateContext();
        context.GroupMembers.Add(new GroupMember
        {
            GroupId = groupId,
            StudentId = studentId
        });
        await context.SaveChangesAsync();

        var repository = new StudentGroupRepository(context);

        var result = await repository.IsMemberAsync(studentId, groupId);

        result.Should().BeTrue();
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }
}

public class ExamTermHistoryRepositoryTests
{
    [Fact]
    public async Task ListByExamTermAsync_ReturnsItems()
    {
        var termId = Guid.NewGuid();
        await using var context = CreateContext();
        context.ExamTermHistories.AddRange(
            new ExamTermHistory
            {
                Id = Guid.NewGuid(),
                ExamTermId = termId,
                ChangedBy = Guid.NewGuid(),
                ChangedAt = DateTime.UtcNow,
                PreviousStatus = ExamTermStatus.Draft,
                NewStatus = ExamTermStatus.Approved
            },
            new ExamTermHistory
            {
                Id = Guid.NewGuid(),
                ExamTermId = Guid.NewGuid(),
                ChangedBy = Guid.NewGuid(),
                ChangedAt = DateTime.UtcNow,
                PreviousStatus = ExamTermStatus.Draft,
                NewStatus = ExamTermStatus.Rejected
            });
        await context.SaveChangesAsync();

        var repository = new ExamTermHistoryRepository(context);

        var results = await repository.ListByExamTermAsync(termId);

        results.Should().ContainSingle(h => h.ExamTermId == termId);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }
}
