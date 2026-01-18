using UniversityExamScheduler.Application.Dtos.Exam.Request;
using UniversityExamScheduler.Application.Dtos.ExamSession.Request;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Request;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Request;
using UniversityExamScheduler.Application.Dtos.Room.Request;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Request;
using UniversityExamScheduler.Application.Dtos.User.Request;
using UniversityExamScheduler.Application.Validators.Exam;
using UniversityExamScheduler.Application.Validators.ExamSession;
using UniversityExamScheduler.Application.Validators.ExamTerm;
using UniversityExamScheduler.Application.Validators.ExamTermHistory;
using UniversityExamScheduler.Application.Validators.Room;
using UniversityExamScheduler.Application.Validators.StudentGroup;
using UniversityExamScheduler.Application.Validators.User;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Tests.Validators;

public class UserValidatorTests
{
    [Fact]
    public void CreateUser_ShouldPass_ForValidData()
    {
        var dto = new CreateUserDto
        {
            Email = "user@example.com",
            FirstName = "Jan",
            LastName = "Kowalski",
            Role = Role.Student,
            IsStarosta = false
        };

        var result = new CreateUserDtoValidator().Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateUser_ShouldFail_ForNonStudentStarosta()
    {
        var dto = new CreateUserDto
        {
            Email = "user@example.com",
            FirstName = "Jan",
            LastName = "Kowalski",
            Role = Role.Admin,
            IsStarosta = true
        };

        var result = new CreateUserDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "IsStarosta");
    }

    [Fact]
    public void UpdateUser_ShouldFail_ForInvalidEmail()
    {
        var dto = new UpdateUserDto
        {
            Email = "invalid",
            FirstName = "Jan",
            LastName = "Kowalski",
            Role = Role.Student
        };

        var result = new UpdateUserDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }
}

public class StudentGroupValidatorTests
{
    [Fact]
    public void CreateStudentGroup_ShouldPass_ForValidData()
    {
        var dto = new CreateStudentGroupDto
        {
            Name = "G1",
            FieldOfStudy = "CS",
            StudyType = StudyType.Stacjonarne,
            Semester = 1,
            StarostaId = Guid.NewGuid()
        };

        var result = new CreateStudentGroupDtoValidator().Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateStudentGroup_ShouldFail_ForInvalidSemester()
    {
        var dto = new CreateStudentGroupDto
        {
            Name = "G1",
            FieldOfStudy = "CS",
            StudyType = StudyType.Stacjonarne,
            Semester = 0,
            StarostaId = Guid.NewGuid()
        };

        var result = new CreateStudentGroupDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Semester");
    }

    [Fact]
    public void UpdateStudentGroup_ShouldFail_ForEmptyName()
    {
        var dto = new UpdateStudentGroupDto
        {
            Name = "",
            FieldOfStudy = "CS",
            StudyType = StudyType.Stacjonarne,
            Semester = 1,
            StarostaId = Guid.NewGuid()
        };

        var result = new UpdateStudentGroupDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }
}

public class RoomValidatorTests
{
    [Fact]
    public void CreateRoom_ShouldPass_ForValidData()
    {
        var dto = new CreateRoomDto
        {
            RoomNumber = "A1",
            Capacity = 10,
            Type = RoomType.Lecture
        };

        var result = new CreateRoomDtoValidator().Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateRoom_ShouldFail_ForNonPositiveCapacity()
    {
        var dto = new CreateRoomDto
        {
            RoomNumber = "A1",
            Capacity = 0,
            Type = RoomType.Lecture
        };

        var result = new CreateRoomDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Capacity");
    }

    [Fact]
    public void UpdateRoom_ShouldFail_ForEmptyRoomNumber()
    {
        var dto = new UpdateRoomDto
        {
            RoomNumber = "",
            Capacity = 10,
            Type = RoomType.Lecture
        };

        var result = new UpdateRoomDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "RoomNumber");
    }
}

public class ExamValidatorTests
{
    [Fact]
    public void CreateExam_ShouldPass_ForValidData()
    {
        var dto = new CreateExamDto
        {
            Name = "Math",
            LecturerId = Guid.NewGuid(),
            GroupId = Guid.NewGuid()
        };

        var result = new CreateExamDtoValidator().Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateExam_ShouldFail_ForEmptyName()
    {
        var dto = new UpdateExamDto
        {
            Name = "",
            LecturerId = Guid.NewGuid(),
            GroupId = Guid.NewGuid()
        };

        var result = new UpdateExamDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }
}

public class ExamSessionValidatorTests
{
    [Fact]
    public void CreateExamSession_ShouldPass_ForValidRange()
    {
        var dto = new CreateExamSessionDto
        {
            Name = "Winter",
            StartDate = new DateOnly(2025, 1, 1),
            EndDate = new DateOnly(2025, 1, 10)
        };

        var result = new CreateExamSessionDtoValidator().Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateExamSession_ShouldFail_WhenStartAfterEnd()
    {
        var dto = new CreateExamSessionDto
        {
            Name = "Winter",
            StartDate = new DateOnly(2025, 1, 10),
            EndDate = new DateOnly(2025, 1, 1)
        };

        var result = new CreateExamSessionDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("start date"));
    }

    [Fact]
    public void UpdateExamSession_ShouldFail_WhenStartAfterEnd()
    {
        var dto = new UpdateExamSessionDto
        {
            Name = "Winter",
            StartDate = new DateOnly(2025, 1, 10),
            EndDate = new DateOnly(2025, 1, 1)
        };

        var result = new UpdateExamSessionDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("start date"));
    }
}

public class ExamTermValidatorTests
{
    [Fact]
    public void CreateExamTerm_ShouldPass_ForValidData()
    {
        var dto = new CreateExamTermDto
        {
            CourseId = Guid.NewGuid(),
            SessionId = Guid.NewGuid(),
            Date = new DateOnly(2025, 1, 5),
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(10, 0),
            Type = ExamTermType.FirstAttempt,
            Status = ExamTermStatus.Draft,
            CreatedBy = Guid.NewGuid()
        };

        var result = new CreateExamTermDtoValidator().Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateExamTerm_ShouldFail_WhenEndBeforeStart()
    {
        var dto = new CreateExamTermDto
        {
            CourseId = Guid.NewGuid(),
            SessionId = Guid.NewGuid(),
            Date = new DateOnly(2025, 1, 5),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(9, 0),
            Type = ExamTermType.FirstAttempt,
            Status = ExamTermStatus.Draft,
            CreatedBy = Guid.NewGuid()
        };

        var result = new CreateExamTermDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "EndTime");
    }

    [Fact]
    public void UpdateExamTerm_ShouldFail_WhenEndBeforeStart()
    {
        var dto = new UpdateExamTermDto
        {
            SessionId = Guid.NewGuid(),
            Date = new DateOnly(2025, 1, 5),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(9, 0),
            Type = ExamTermType.FirstAttempt,
            Status = ExamTermStatus.Draft
        };

        var result = new UpdateExamTermDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "EndTime");
    }
}

public class ExamTermHistoryValidatorTests
{
    [Fact]
    public void CreateExamTermHistory_ShouldPass_ForValidData()
    {
        var dto = new CreateExamTermHistoryDto
        {
            ExamTermId = Guid.NewGuid(),
            ChangedBy = Guid.NewGuid(),
            ChangedAt = DateTime.UtcNow,
            PreviousStatus = ExamTermStatus.Draft,
            NewStatus = ExamTermStatus.Approved
        };

        var result = new CreateExamTermHistoryDtoValidator().Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateExamTermHistory_ShouldFail_ForMissingExamTerm()
    {
        var dto = new CreateExamTermHistoryDto
        {
            ExamTermId = Guid.Empty,
            ChangedBy = Guid.NewGuid(),
            ChangedAt = DateTime.UtcNow,
            PreviousStatus = ExamTermStatus.Draft,
            NewStatus = ExamTermStatus.Approved
        };

        var result = new CreateExamTermHistoryDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ExamTermId");
    }

    [Fact]
    public void UpdateExamTermHistory_ShouldFail_ForMissingChangedAt()
    {
        var dto = new UpdateExamTermHistoryDto
        {
            ExamTermId = Guid.NewGuid(),
            ChangedBy = Guid.NewGuid(),
            ChangedAt = default,
            PreviousStatus = ExamTermStatus.Draft,
            NewStatus = ExamTermStatus.Approved
        };

        var result = new UpdateExamTermHistoryDtoValidator().Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ChangedAt");
    }
}
