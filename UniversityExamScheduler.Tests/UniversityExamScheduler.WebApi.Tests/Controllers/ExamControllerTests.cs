using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.Exam.Request;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.WebApi.Controllers;
using UniversityExamScheduler.WebApi.Tests.Helpers;

namespace UniversityExamScheduler.WebApi.Tests.Controllers;

public class ExamControllerTests
{
    [Fact]
    public async Task GetById_ReturnsForbid_WhenLecturerNotOwner()
    {
        var lecturerId = Guid.NewGuid();
        var otherLecturerId = Guid.NewGuid();
        var examService = new Mock<IExamService>();
        examService.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Exam
            {
                Id = Guid.NewGuid(),
                Name = "Math",
                LecturerId = otherLecturerId,
                GroupId = Guid.NewGuid()
            });
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = ControllerTestHelper.WithUser(
            new ExamController(examService.Object, mapper),
            ControllerTestHelper.BuildUser(Role.Lecturer, lecturerId));

        var result = await controller.GetById(Guid.NewGuid(), default);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task List_ReturnsForbid_WhenStudentMissingId()
    {
        var examService = new Mock<IExamService>();
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = ControllerTestHelper.WithUser(
            new ExamController(examService.Object, mapper),
            ControllerTestHelper.BuildUser(Role.Student, userId: null));

        var result = await controller.List(default);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task AddExam_ReturnsCreated()
    {
        var examService = new Mock<IExamService>();
        examService.Setup(s => s.AddAsync(It.IsAny<CreateExamDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Exam
            {
                Id = Guid.NewGuid(),
                Name = "Math",
                LecturerId = Guid.NewGuid(),
                GroupId = Guid.NewGuid()
            });
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = new ExamController(examService.Object, mapper);

        var result = await controller.AddExam(new CreateExamDto
        {
            Name = "Math",
            LecturerId = Guid.NewGuid(),
            GroupId = Guid.NewGuid()
        }, default);

        result.Should().BeOfType<CreatedAtActionResult>();
    }
}
