using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.WebApi.Extensions;

public static class DatabaseSeeder
{
    public static async Task SeedReferenceDataAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseSeeder");

        try
        {
            await context.Database.MigrateAsync(cancellationToken);

            var starosta = await EnsureUserAsync(
                context,
                new Guid("6f1d17c3-1b7b-4ef0-b632-4c8586f09a1c"),
                "starosta@example.com",
                "Jan",
                "Kowalski",
                Role.Student,
                isStarosta: true,
                cancellationToken);

            var lecturer = await EnsureUserAsync(
                context,
                new Guid("d2d3f1aa-3e7d-4cd2-9d4c-6c3c2a74e2ce"),
                "prowadza@example.com",
                "Piotr",
                "Wisniewski",
                Role.Lecturer,
                isStarosta: false,
                cancellationToken);

            var lecturer2 = await EnsureUserAsync(
                context,
                new Guid("f7b90f3e-cb83-4a3b-9b9c-727b69d8c1f9"),
                "prowadzb@example.com",
                "Anna",
                "Lewandowska",
                Role.Lecturer,
                isStarosta: false,
                cancellationToken);

            var student = await EnsureUserAsync(
                context,
                new Guid("bdb3e8f6-6402-4f7d-9a9c-27aaf6f8ff4d"),
                "student@example.com",
                "Marek",
                "Zielinski",
                Role.Student,
                isStarosta: false,
                cancellationToken);

            var deanOffice = await EnsureUserAsync(
                context,
                new Guid("2b67ea8b-4855-4a7e-a3cb-0c6a8c1f76d9"),
                "dziekanat@example.com",
                "Anna",
                "Nowak",
                Role.DeanOffice,
                isStarosta: false,
                cancellationToken);

            var group1 = await EnsureGroupAsync(
                context,
                new Guid("8b80c1ab-2a6c-47f4-9af6-6f6c34baac4e"),
                "INF-3-STA",
                "Informatyka",
                StudyType.Stacjonarne,
                semester: 5,
                starosta.Id,
                cancellationToken);

            await EnsureGroupAsync(
                context,
                new Guid("dd6f3f45-3c39-44e8-8f1c-7d8ccf3c7d3b"),
                "INF-3-NIE",
                "Informatyka",
                StudyType.Niestacjonarne,
                semester: 5,
                starosta.Id,
                cancellationToken);

            await EnsureGroupMembershipAsync(context, group1.Id, starosta.Id, cancellationToken);
            await EnsureGroupMembershipAsync(context, group1.Id, student.Id, cancellationToken);

            await EnsureRoomsAsync(context, cancellationToken);
            await EnsureExamSessionAsync(context, cancellationToken);
            await EnsureExamsAsync(context, group1.Id, lecturer.Id, lecturer2.Id, cancellationToken);
            await EnsureExamTermsAsync(context, deanOffice.Id, cancellationToken);

            await context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to seed reference data");
        }
    }

    private static async Task<User> EnsureUserAsync(
        ApplicationDbContext context,
        Guid id,
        string email,
        string firstName,
        string lastName,
        Role role,
        bool isStarosta,
        CancellationToken cancellationToken)
    {
        var existing = await context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (existing is not null) return existing;

        var user = new User
        {
            Id = id,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Role = role,
            IsStarosta = isStarosta,
            IsActive = true
        };

        await context.Users.AddAsync(user, cancellationToken);
        return user;
    }

    private static async Task<StudentGroup> EnsureGroupAsync(
        ApplicationDbContext context,
        Guid id,
        string name,
        string fieldOfStudy,
        StudyType studyType,
        int semester,
        Guid starostaId,
        CancellationToken cancellationToken)
    {
        var existing = await context.StudentGroups.FirstOrDefaultAsync(g => g.Name == name, cancellationToken);
        if (existing is not null) return existing;

        var group = new StudentGroup
        {
            Id = id,
            Name = name,
            FieldOfStudy = fieldOfStudy,
            StudyType = studyType,
            Semester = semester,
            StarostaId = starostaId
        };

        await context.StudentGroups.AddAsync(group, cancellationToken);
        return group;
    }

    private static async Task EnsureGroupMembershipAsync(
        ApplicationDbContext context,
        Guid groupId,
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var exists = await context.GroupMembers.AnyAsync(
            gm => gm.GroupId == groupId && gm.StudentId == studentId,
            cancellationToken);
        if (exists) return;

        await context.GroupMembers.AddAsync(new GroupMember { GroupId = groupId, StudentId = studentId }, cancellationToken);
    }

    private static async Task EnsureRoomsAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        if (await context.Rooms.AnyAsync(cancellationToken)) return;

        await context.Rooms.AddRangeAsync(
            new[]
            {
                new Room
                {
                    Id = new Guid("5d1c8b37-5e93-4f4c-9a4e-89c0a2d1048d"),
                    RoomNumber = "A-100",
                    Capacity = 40,
                    Type = RoomType.Lecture,
                    IsAvailable = true
                },
                new Room
                {
                    Id = new Guid("e9f9e5b0-9b8c-4e8c-9b1e-7a5c1af3f274"),
                    RoomNumber = "B-205",
                    Capacity = 25,
                    Type = RoomType.Computer,
                    IsAvailable = true
                }
            },
            cancellationToken);
    }

    private static async Task EnsureExamSessionAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        if (await context.ExamSessions.AnyAsync(cancellationToken)) return;

        await context.ExamSessions.AddAsync(
            new ExamSession
            {
                Id = new Guid("b36bc29b-933b-4cd0-8f4a-07f0703c2fa3"),
                Name = "Sesja zimowa 2025/2026",
                StartDate = new DateOnly(2026, 1, 5),
                EndDate = new DateOnly(2026, 2, 15),
                IsActive = true
            },
            cancellationToken);
    }

    private static async Task EnsureExamsAsync(
        ApplicationDbContext context,
        Guid groupId,
        Guid lecturerId,
        Guid lecturer2Id,
        CancellationToken cancellationToken)
    {
        if (await context.Exams.AnyAsync(cancellationToken)) return;

        await context.Exams.AddRangeAsync(
            new[]
            {
                new Exam
                {
                    Id = new Guid("aef2e30d-a5c3-4dc0-8b8a-5b3a2d9811b8"),
                    Name = "Matematyka",
                    GroupId = groupId,
                    LecturerId = lecturer2Id
                },
                new Exam
                {
                    Id = new Guid("db34158a-02c1-4d9c-9685-e4782b0bc62c"),
                    Name = "Programowanie",
                    GroupId = groupId,
                    LecturerId = lecturer2Id
                },
                new Exam
                {
                    Id = new Guid("f182a2a7-8a49-49a9-9b37-8d29a2f92c80"),
                    Name = "Algorytmy",
                    GroupId = groupId,
                    LecturerId = lecturer2Id
                }
            },
            cancellationToken);
    }

    private static async Task EnsureExamTermsAsync(
        ApplicationDbContext context,
        Guid createdById,
        CancellationToken cancellationToken)
    {
        if (await context.ExamTerms.AnyAsync(cancellationToken)) return;

        var sessionId = new Guid("b36bc29b-933b-4cd0-8f4a-07f0703c2fa3");
        var roomAId = new Guid("5d1c8b37-5e93-4f4c-9a4e-89c0a2d1048d");
        var roomBId = new Guid("e9f9e5b0-9b8c-4e8c-9b1e-7a5c1af3f274");

        var mathId = new Guid("aef2e30d-a5c3-4dc0-8b8a-5b3a2d9811b8");
        var progId = new Guid("db34158a-02c1-4d9c-9685-e4782b0bc62c");
        var algoId = new Guid("f182a2a7-8a49-49a9-9b37-8d29a2f92c80");

        await context.ExamTerms.AddRangeAsync(
            new[]
            {
                new ExamTerm
                {
                    Id = new Guid("f6c9d7b5-62ce-4a76-8f62-2d7ddc3b2e9b"),
                    CourseId = mathId,
                    SessionId = sessionId,
                    RoomId = roomAId,
                    Date = new DateOnly(2026, 1, 10),
                    StartTime = new TimeOnly(9, 0),
                    EndTime = new TimeOnly(11, 0),
                    Type = ExamTermType.FirstAttempt,
                    Status = ExamTermStatus.Approved,
                    CreatedBy = createdById
                },
                new ExamTerm
                {
                    Id = new Guid("aa46f14c-0e74-4d4f-9d3c-8f93f31b4e50"),
                    CourseId = progId,
                    SessionId = sessionId,
                    RoomId = roomBId,
                    Date = new DateOnly(2026, 1, 15),
                    StartTime = new TimeOnly(12, 0),
                    EndTime = new TimeOnly(13, 30),
                    Type = ExamTermType.FirstAttempt,
                    Status = ExamTermStatus.ProposedByLecturer,
                    CreatedBy = createdById
                },
                new ExamTerm
                {
                    Id = new Guid("5f1a9ab8-3321-4b6c-8a59-1a83c3f2d0cb"),
                    CourseId = algoId,
                    SessionId = sessionId,
                    RoomId = roomAId,
                    Date = new DateOnly(2026, 1, 20),
                    StartTime = new TimeOnly(14, 0),
                    EndTime = new TimeOnly(15, 30),
                    Type = ExamTermType.FirstAttempt,
                    Status = ExamTermStatus.ProposedByStudent,
                    CreatedBy = createdById
                }
            },
            cancellationToken);
    }
}
