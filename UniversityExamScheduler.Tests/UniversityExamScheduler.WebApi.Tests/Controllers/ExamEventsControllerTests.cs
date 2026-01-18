using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.WebApi.Controllers;
using UniversityExamScheduler.WebApi.Tests.Helpers;

namespace UniversityExamScheduler.WebApi.Tests.Controllers;

public class ExamEventsControllerTests
{
    [Fact]
    public async Task List_ReturnsUnauthorized_WhenRoleMissing()
    {
        var termService = new Mock<IExamTermService>();
        var controller = ControllerTestHelper.WithUser(
            new ExamEventsController(termService.Object),
            new ClaimsPrincipal(new ClaimsIdentity()));

        var result = await controller.List(default);

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task List_ReturnsOk_ForAdmin()
    {
        var termService = new Mock<IExamTermService>();
        var lecturer = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Adam",
            LastName = "Nowak"
        };
        var group = new StudentGroup
        {
            Id = Guid.NewGuid(),
            Name = "G1",
            FieldOfStudy = "CS",
            StudyType = StudyType.Stacjonarne,
            Semester = 1,
            StarostaId = Guid.NewGuid()
        };
        var exam = new Exam
        {
            Id = Guid.NewGuid(),
            Name = "Math",
            LecturerId = lecturer.Id,
            Lecturer = lecturer,
            GroupId = group.Id,
            Group = group
        };
        var term = new ExamTerm
        {
            Id = Guid.NewGuid(),
            Exam = exam,
            CourseId = exam.Id,
            Date = new DateOnly(2025, 1, 5),
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(10, 0),
            Status = ExamTermStatus.Approved
        };
        termService.Setup(s => s.ListWithDetailsAsync(null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { term });

        var controller = ControllerTestHelper.WithUser(
            new ExamEventsController(termService.Object),
            ControllerTestHelper.BuildUser(Role.Admin));

        var result = await controller.List(default);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var payload = ok.Value.Should().BeAssignableTo<IEnumerable<ExamEventsController.ExamEventDto>>().Subject;
        payload.Should().ContainSingle(e => e.Title == "Math");
    }
}
