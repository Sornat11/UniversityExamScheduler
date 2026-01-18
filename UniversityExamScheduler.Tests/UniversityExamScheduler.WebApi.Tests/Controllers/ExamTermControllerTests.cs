using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Request;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.WebApi.Controllers;
using UniversityExamScheduler.WebApi.Tests.Helpers;

namespace UniversityExamScheduler.WebApi.Tests.Controllers;

public class ExamTermControllerTests
{
    [Fact]
    public async Task AddTerm_ReturnsBadRequest_WhenCreatedByMissingForAdmin()
    {
        var termService = new Mock<IExamTermService>();
        var examService = new Mock<IExamService>();
        var groupService = new Mock<IStudentGroupService>();
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = ControllerTestHelper.WithUser(
            new ExamTermController(termService.Object, examService.Object, groupService.Object, mapper),
            ControllerTestHelper.BuildUser(Role.Admin));

        var result = await controller.AddTerm(new CreateExamTermDto
        {
            CourseId = Guid.NewGuid(),
            SessionId = Guid.NewGuid(),
            Date = new DateOnly(2025, 1, 5),
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(10, 0),
            Type = ExamTermType.FirstAttempt,
            Status = ExamTermStatus.Draft,
            CreatedBy = Guid.Empty
        }, default);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task AddTerm_ReturnsCreated_ForAdminWithCreatedBy()
    {
        var termService = new Mock<IExamTermService>();
        termService.Setup(s => s.AddAsync(It.IsAny<CreateExamTermDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExamTerm
            {
                Id = Guid.NewGuid(),
                CourseId = Guid.NewGuid(),
                SessionId = Guid.NewGuid(),
                Date = new DateOnly(2025, 1, 5),
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(10, 0),
                Type = ExamTermType.FirstAttempt,
                Status = ExamTermStatus.Draft,
                CreatedBy = Guid.NewGuid()
            });
        var examService = new Mock<IExamService>();
        var groupService = new Mock<IStudentGroupService>();
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = ControllerTestHelper.WithUser(
            new ExamTermController(termService.Object, examService.Object, groupService.Object, mapper),
            ControllerTestHelper.BuildUser(Role.Admin));

        var result = await controller.AddTerm(new CreateExamTermDto
        {
            CourseId = Guid.NewGuid(),
            SessionId = Guid.NewGuid(),
            Date = new DateOnly(2025, 1, 5),
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(10, 0),
            Type = ExamTermType.FirstAttempt,
            Status = ExamTermStatus.Draft,
            CreatedBy = Guid.NewGuid()
        }, default);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task ApproveByStarosta_ReturnsForbid_WhenNotStarosta()
    {
        var termService = new Mock<IExamTermService>();
        var examService = new Mock<IExamService>();
        var groupService = new Mock<IStudentGroupService>();
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = ControllerTestHelper.WithUser(
            new ExamTermController(termService.Object, examService.Object, groupService.Object, mapper),
            ControllerTestHelper.BuildUser(Role.Student, Guid.NewGuid(), isStarosta: false));

        var result = await controller.ApproveByStarosta(Guid.NewGuid(), default);

        result.Should().BeOfType<ForbidResult>();
    }
}
