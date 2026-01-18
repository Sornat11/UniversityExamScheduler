using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Infrastructure.Persistence;
using UniversityExamScheduler.Infrastructure.Repositories;

namespace UniversityExamScheduler.Infrastructure.Tests.Repositories;

public class ExamRepositoryTests
{
    [Fact]
    public async Task ListForStudentAsync_ReturnsItemsForMembership()
    {
        var studentId = Guid.NewGuid();
        var lecturerId = Guid.NewGuid();
        var groupId = Guid.NewGuid();

        await using var context = CreateContext();
        var group = new StudentGroup
        {
            Id = groupId,
            Name = "G1",
            FieldOfStudy = "CS",
            StudyType = StudyType.Stacjonarne,
            Semester = 1,
            StarostaId = studentId
        };
        var exam = new Exam
        {
            Id = Guid.NewGuid(),
            Name = "Math",
            LecturerId = lecturerId,
            GroupId = groupId
        };
        context.StudentGroups.Add(group);
        context.Exams.Add(exam);
        context.GroupMembers.Add(new GroupMember
        {
            GroupId = groupId,
            StudentId = studentId
        });
        await context.SaveChangesAsync();

        var repository = new ExamRepository(context);

        var results = await repository.ListForStudentAsync(studentId);

        results.Should().ContainSingle(e => e.Id == exam.Id);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }
}
