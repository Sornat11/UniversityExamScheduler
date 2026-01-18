using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Infrastructure.Persistence;
using UniversityExamScheduler.Infrastructure.Repositories;

namespace UniversityExamScheduler.Infrastructure.Tests.Repositories;

public class ExamTermRepositoryTests
{
    [Fact]
    public async Task ListByCourseAsync_ReturnsMatchingTerms()
    {
        var courseId = Guid.NewGuid();
        await using var context = CreateContext();
        context.ExamTerms.AddRange(
            new ExamTerm
            {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                SessionId = Guid.NewGuid(),
                Date = new DateOnly(2025, 1, 10),
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(10, 0),
                Type = ExamTermType.FirstAttempt,
                Status = ExamTermStatus.Draft,
                CreatedBy = Guid.NewGuid()
            },
            new ExamTerm
            {
                Id = Guid.NewGuid(),
                CourseId = Guid.NewGuid(),
                SessionId = Guid.NewGuid(),
                Date = new DateOnly(2025, 1, 11),
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(10, 0),
                Type = ExamTermType.FirstAttempt,
                Status = ExamTermStatus.Draft,
                CreatedBy = Guid.NewGuid()
            });
        await context.SaveChangesAsync();

        var repository = new ExamTermRepository(context);

        var results = await repository.ListByCourseAsync(courseId);

        results.Should().HaveCount(1);
    }

    [Fact]
    public async Task ExistsOutsideSessionAsync_ReturnsTrue_ForOutOfRangeDate()
    {
        var sessionId = Guid.NewGuid();
        await using var context = CreateContext();
        context.ExamTerms.Add(new ExamTerm
        {
            Id = Guid.NewGuid(),
            CourseId = Guid.NewGuid(),
            SessionId = sessionId,
            Date = new DateOnly(2025, 2, 1),
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(10, 0),
            Type = ExamTermType.FirstAttempt,
            Status = ExamTermStatus.Draft,
            CreatedBy = Guid.NewGuid()
        });
        await context.SaveChangesAsync();

        var repository = new ExamTermRepository(context);

        var exists = await repository.ExistsOutsideSessionAsync(
            sessionId,
            new DateOnly(2025, 1, 1),
            new DateOnly(2025, 1, 31));

        exists.Should().BeTrue();
    }

    [Fact]
    public async Task ListWithDetailsAsync_FiltersByLecturerAndStudent()
    {
        var lecturerId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        await using var context = CreateContext();

        var group = new StudentGroup
        {
            Id = Guid.NewGuid(),
            Name = "G1",
            FieldOfStudy = "CS",
            StudyType = StudyType.Stacjonarne,
            Semester = 1,
            StarostaId = studentId
        };
        var lecturer = new User
        {
            Id = lecturerId,
            Email = "lecturer@example.com",
            FirstName = "Adam",
            LastName = "Nowak",
            Role = Role.Lecturer
        };
        var student = new User
        {
            Id = studentId,
            Email = "student@example.com",
            FirstName = "Jan",
            LastName = "Kowalski",
            Role = Role.Student
        };
        var exam = new Exam
        {
            Id = Guid.NewGuid(),
            Name = "Math",
            LecturerId = lecturerId,
            Lecturer = lecturer,
            GroupId = group.Id,
            Group = group
        };
        var room = new Room
        {
            Id = Guid.NewGuid(),
            RoomNumber = "A1",
            Capacity = 10,
            Type = RoomType.Lecture
        };
        var session = new ExamSession
        {
            Id = Guid.NewGuid(),
            Name = "Winter",
            StartDate = new DateOnly(2025, 1, 1),
            EndDate = new DateOnly(2025, 1, 10)
        };
        var term = new ExamTerm
        {
            Id = Guid.NewGuid(),
            CourseId = exam.Id,
            Exam = exam,
            SessionId = session.Id,
            Session = session,
            RoomId = room.Id,
            Room = room,
            Date = new DateOnly(2025, 1, 5),
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(10, 0),
            Type = ExamTermType.FirstAttempt,
            Status = ExamTermStatus.Approved,
            CreatedBy = lecturerId
        };

        context.Users.AddRange(lecturer, student);
        context.StudentGroups.Add(group);
        context.Exams.Add(exam);
        context.Rooms.Add(room);
        context.ExamSessions.Add(session);
        context.ExamTerms.Add(term);
        context.GroupMembers.Add(new GroupMember { GroupId = group.Id, StudentId = studentId });
        await context.SaveChangesAsync();

        var repository = new ExamTermRepository(context);

        var byLecturer = await repository.ListWithDetailsAsync(lecturerId, null);
        var byStudent = await repository.ListWithDetailsAsync(null, studentId);

        byLecturer.Should().ContainSingle(t => t.Id == term.Id);
        byStudent.Should().ContainSingle(t => t.Id == term.Id);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }
}
