using Bogus;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.WebApi.Extensions;

public static class DatabaseSeeder
{
    private const int BogusSeed = 20260113;
    private const int BogusStarostaCount = 2;
    private const int BogusStudentCount = 8;
    private const int BogusLecturerCount = 2;
    private const int BogusGroupCount = 2;
    private const int BogusRoomCount = 4;
    private const int BogusMembersPerGroup = 6;
    private const int BogusExamsPerGroup = 3;
    private const int BogusTermsPerExam = 1;

    private static readonly string[] BogusFieldsOfStudy =
    {
        "Informatyka",
        "Matematyka",
        "Automatyka",
        "Ekonomia",
        "Zarzadzanie",
        "Mechanika"
    };

    private static readonly string[] BogusCourseNames =
    {
        "Matematyka",
        "Programowanie",
        "Algorytmy",
        "Bazy danych",
        "Systemy operacyjne",
        "Sieci komputerowe",
        "Inzynieria oprogramowania",
        "Analiza matematyczna",
        "Fizyka",
        "Grafika komputerowa"
    };

    private static readonly RoomType[] BogusRoomTypes = { RoomType.Lecture, RoomType.Lab, RoomType.Computer };
    private static readonly StudyType[] BogusStudyTypes = { StudyType.Stacjonarne, StudyType.Niestacjonarne };
    private static readonly ExamTermType[] BogusTermTypes =
    {
        ExamTermType.FirstAttempt,
        ExamTermType.Retake,
        ExamTermType.Commission
    };

    private static readonly ExamTermStatus[] BogusTermStatuses =
    {
        ExamTermStatus.Draft,
        ExamTermStatus.ProposedByLecturer,
        ExamTermStatus.ProposedByStudent,
        ExamTermStatus.Approved
    };

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

            var group2 = await EnsureGroupAsync(
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

            await SeedBogusDataAsync(
                context,
                group1,
                group2,
                starosta,
                student,
                lecturer,
                lecturer2,
                deanOffice,
                cancellationToken);

            logger.LogInformation("Seeded data");

            await context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to seed reference data");
        }
    }

    private static async Task SeedBogusDataAsync(
        ApplicationDbContext context,
        StudentGroup group1,
        StudentGroup group2,
        User starosta,
        User student,
        User lecturer,
        User lecturer2,
        User deanOffice,
        CancellationToken cancellationToken)
    {
        Randomizer.Seed = new Random(BogusSeed);
        var faker = new Faker("en");

        var extraStarostas = new List<User>();
        for (var i = 1; i <= BogusStarostaCount; i++)
        {
            var user = await EnsureUserAsync(
                context,
                Guid.NewGuid(),
                $"starosta{i}@example.com",
                faker.Name.FirstName(),
                faker.Name.LastName(),
                Role.Student,
                isStarosta: true,
                cancellationToken);
            extraStarostas.Add(user);
        }

        var extraStudents = new List<User>();
        for (var i = 1; i <= BogusStudentCount; i++)
        {
            var user = await EnsureUserAsync(
                context,
                Guid.NewGuid(),
                $"student{i}@example.com",
                faker.Name.FirstName(),
                faker.Name.LastName(),
                Role.Student,
                isStarosta: false,
                cancellationToken);
            extraStudents.Add(user);
        }

        var extraLecturers = new List<User>();
        for (var i = 1; i <= BogusLecturerCount; i++)
        {
            var user = await EnsureUserAsync(
                context,
                Guid.NewGuid(),
                $"lecturer{i}@example.com",
                faker.Name.FirstName(),
                faker.Name.LastName(),
                Role.Lecturer,
                isStarosta: false,
                cancellationToken);
            extraLecturers.Add(user);
        }

        var allStudents = new List<User> { starosta, student };
        allStudents.AddRange(extraStarostas);
        allStudents.AddRange(extraStudents);

        var allLecturers = new List<User> { lecturer, lecturer2 };
        allLecturers.AddRange(extraLecturers);

        var rooms = context.Rooms.Local.ToList();
        if (rooms.Count == 0)
        {
            rooms = await context.Rooms.ToListAsync(cancellationToken);
        }

        for (var i = 1; i <= BogusRoomCount; i++)
        {
            var roomNumber = BuildRoomNumber(faker, i);
            var roomType = BogusRoomTypes[faker.Random.Int(0, BogusRoomTypes.Length - 1)];
            var room = await EnsureRoomAsync(
                context,
                Guid.NewGuid(),
                roomNumber,
                faker.Random.Int(20, 80),
                roomType,
                isAvailable: true,
                cancellationToken);
            if (rooms.All(existing => existing.Id != room.Id))
            {
                rooms.Add(room);
            }
        }

        var groups = new List<StudentGroup> { group1, group2 };
        var extraGroups = new List<StudentGroup>();

        for (var i = 1; i <= BogusGroupCount; i++)
        {
            var fieldOfStudy = BogusFieldsOfStudy[faker.Random.Int(0, BogusFieldsOfStudy.Length - 1)];
            var studyType = BogusStudyTypes[faker.Random.Int(0, BogusStudyTypes.Length - 1)];
            var semester = faker.Random.Int(1, 7);
            var name = BuildGroupName(fieldOfStudy, studyType, semester, i);
            var groupStarosta = extraStarostas.ElementAtOrDefault(i - 1) ?? starosta;

            var group = await EnsureGroupAsync(
                context,
                Guid.NewGuid(),
                name,
                fieldOfStudy,
                studyType,
                semester,
                groupStarosta.Id,
                cancellationToken);

            extraGroups.Add(group);

            await EnsureGroupMembershipAsync(context, group.Id, groupStarosta.Id, cancellationToken);

            var membersNeeded = BogusMembersPerGroup - 1;
            if (membersNeeded > 0 && allStudents.Count > 1)
            {
                var members = allStudents
                    .Where(s => s.Id != groupStarosta.Id)
                    .OrderBy(_ => faker.Random.Int())
                    .Take(Math.Min(membersNeeded, allStudents.Count - 1));

                foreach (var member in members)
                {
                    await EnsureGroupMembershipAsync(context, group.Id, member.Id, cancellationToken);
                }
            }
        }

        groups.AddRange(extraGroups);

        var newExams = new List<Exam>();
        foreach (var group in groups)
        {
            var examsForGroup = await EnsureExamsForGroupAsync(context, group, allLecturers, faker, cancellationToken);
            newExams.AddRange(examsForGroup);
        }

        var session = await GetActiveSessionAsync(context, cancellationToken);
        if (session is null)
        {
            return;
        }

        var exams = await context.Exams.ToListAsync(cancellationToken);
        var examIds = new HashSet<Guid>(exams.Select(e => e.Id));
        foreach (var exam in newExams)
        {
            if (examIds.Add(exam.Id))
            {
                exams.Add(exam);
            }
        }

        foreach (var exam in exams)
        {
            await EnsureExamTermsForExamAsync(context, exam, session, rooms, deanOffice.Id, faker, cancellationToken);
        }
    }

    private static async Task<ExamSession?> GetActiveSessionAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        var session = context.ExamSessions.Local.FirstOrDefault(s => s.IsActive);
        if (session is not null) return session;

        session = await context.ExamSessions.FirstOrDefaultAsync(s => s.IsActive, cancellationToken);
        if (session is not null) return session;

        return await context.ExamSessions.FirstOrDefaultAsync(cancellationToken);
    }

    private static async Task<Room> EnsureRoomAsync(
        ApplicationDbContext context,
        Guid id,
        string roomNumber,
        int capacity,
        RoomType type,
        bool isAvailable,
        CancellationToken cancellationToken)
    {
        var existing = await context.Rooms.FirstOrDefaultAsync(r => r.RoomNumber == roomNumber, cancellationToken);
        if (existing is not null) return existing;

        var room = new Room
        {
            Id = id,
            RoomNumber = roomNumber,
            Capacity = capacity,
            Type = type,
            IsAvailable = isAvailable
        };

        await context.Rooms.AddAsync(room, cancellationToken);
        return room;
    }

    private static async Task<Exam> EnsureExamByNameAsync(
        ApplicationDbContext context,
        string name,
        Guid groupId,
        Guid lecturerId,
        CancellationToken cancellationToken)
    {
        var existing = await context.Exams.FirstOrDefaultAsync(
            e => e.Name == name && e.GroupId == groupId,
            cancellationToken);
        if (existing is not null) return existing;

        var exam = new Exam
        {
            Id = Guid.NewGuid(),
            Name = name,
            GroupId = groupId,
            LecturerId = lecturerId
        };

        await context.Exams.AddAsync(exam, cancellationToken);
        return exam;
    }

    private static async Task<List<Exam>> EnsureExamsForGroupAsync(
        ApplicationDbContext context,
        StudentGroup group,
        IReadOnlyList<User> lecturers,
        Faker faker,
        CancellationToken cancellationToken)
    {
        var existingCount = await context.Exams.CountAsync(e => e.GroupId == group.Id, cancellationToken);
        var missing = BogusExamsPerGroup - existingCount;
        if (missing <= 0 || lecturers.Count == 0) return new List<Exam>();

        var shuffledNames = BogusCourseNames
            .OrderBy(_ => faker.Random.Int())
            .ToList();

        var created = new List<Exam>();
        for (var i = 0; i < missing; i++)
        {
            var name = shuffledNames[i % shuffledNames.Count];
            var lecturer = lecturers[faker.Random.Int(0, lecturers.Count - 1)];
            var exam = await EnsureExamByNameAsync(context, name, group.Id, lecturer.Id, cancellationToken);
            created.Add(exam);
        }

        return created;
    }

    private static async Task EnsureExamTermsForExamAsync(
        ApplicationDbContext context,
        Exam exam,
        ExamSession session,
        IReadOnlyList<Room> rooms,
        Guid createdById,
        Faker faker,
        CancellationToken cancellationToken)
    {
        var existingCount = await context.ExamTerms.CountAsync(et => et.CourseId == exam.Id, cancellationToken);
        var missing = BogusTermsPerExam - existingCount;
        if (missing <= 0) return;

        var startDateTime = session.StartDate.ToDateTime(TimeOnly.MinValue);
        var endDateTime = session.EndDate.ToDateTime(TimeOnly.MinValue);

        for (var i = 0; i < missing; i++)
        {
            var dateTime = faker.Date.Between(startDateTime, endDateTime);
            var startHour = faker.Random.Int(8, 15);
            var startMinute = faker.Random.Bool() ? 0 : 30;
            var startTime = new TimeOnly(startHour, startMinute);
            var durationMinutes = faker.Random.Int(90, 180);
            var endTime = startTime.AddMinutes(durationMinutes);
            var room = rooms.Count > 0 ? rooms[faker.Random.Int(0, rooms.Count - 1)] : null;
            var termType = BogusTermTypes[faker.Random.Int(0, BogusTermTypes.Length - 1)];
            var termStatus = BogusTermStatuses[faker.Random.Int(0, BogusTermStatuses.Length - 1)];

            var term = new ExamTerm
            {
                Id = Guid.NewGuid(),
                CourseId = exam.Id,
                SessionId = session.Id,
                RoomId = room?.Id,
                Date = DateOnly.FromDateTime(dateTime),
                StartTime = startTime,
                EndTime = endTime,
                Type = termType,
                Status = termStatus,
                CreatedBy = createdById
            };

            await context.ExamTerms.AddAsync(term, cancellationToken);
        }
    }

    private static string BuildGroupName(string fieldOfStudy, StudyType studyType, int semester, int index)
    {
        var prefix = fieldOfStudy.Length >= 3
            ? fieldOfStudy[..3].ToUpperInvariant()
            : fieldOfStudy.ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(prefix))
        {
            prefix = "GRP";
        }

        var suffix = studyType == StudyType.Stacjonarne ? "STA" : "NIE";
        return $"{prefix}-{semester}-{suffix}-{index:00}";
    }

    private static string BuildRoomNumber(Faker faker, int index)
    {
        var building = faker.Random.Char('A', 'D');
        var number = 100 + index;
        return $"{building}-{number}";
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
        await EnsureExamAsync(
            context,
            new Guid("aef2e30d-a5c3-4dc0-8b8a-5b3a2d9811b8"),
            "Matematyka",
            groupId,
            lecturerId,
            cancellationToken);

        await EnsureExamAsync(
            context,
            new Guid("db34158a-02c1-4d9c-9685-e4782b0bc62c"),
            "Programowanie",
            groupId,
            lecturer2Id,
            cancellationToken);

        await EnsureExamAsync(
            context,
            new Guid("f182a2a7-8a49-49a9-9b37-8d29a2f92c80"),
            "Algorytmy",
            groupId,
            lecturerId,
            cancellationToken);
    }

    private static async Task<Exam> EnsureExamAsync(
        ApplicationDbContext context,
        Guid id,
        string name,
        Guid groupId,
        Guid lecturerId,
        CancellationToken cancellationToken)
    {
        var existing = await context.Exams.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (existing is not null)
        {
            existing.Name = name;
            existing.GroupId = groupId;
            existing.LecturerId = lecturerId;
            return existing;
        }

        var exam = new Exam
        {
            Id = id,
            Name = name,
            GroupId = groupId,
            LecturerId = lecturerId
        };

        await context.Exams.AddAsync(exam, cancellationToken);
        return exam;
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
