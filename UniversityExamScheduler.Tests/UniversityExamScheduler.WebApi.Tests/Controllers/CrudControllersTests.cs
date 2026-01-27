using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.ExamSession.Request;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Request;
using UniversityExamScheduler.Application.Dtos.Room.Request;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Request;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.WebApi.Controllers;
using UniversityExamScheduler.WebApi.Tests.Helpers;

namespace UniversityExamScheduler.WebApi.Tests.Controllers;

public class CrudControllersTests
{
    [Fact]
    public async Task RoomController_Get_ReturnsNotFound_WhenRoomMissing()
    {
        var roomService = new Mock<IRoomService>();
        roomService.Setup(s => s.GetByRoomNumberAsync("A1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Room?)null);
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = new RoomController(roomService.Object, mapper);

        var result = await controller.Get("A1", cancellationToken: default);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task RoomController_Add_ReturnsCreated()
    {
        var roomService = new Mock<IRoomService>();
        roomService.Setup(s => s.AddAsync(It.IsAny<CreateRoomDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Room
            {
                Id = Guid.NewGuid(),
                RoomNumber = "A1",
                Capacity = 10,
                Type = RoomType.Lecture
            });
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = new RoomController(roomService.Object, mapper);

        var result = await controller.AddRoom(new CreateRoomDto
        {
            RoomNumber = "A1",
            Capacity = 10,
            Type = RoomType.Lecture
        }, default);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task StudentGroupController_Add_ReturnsCreated()
    {
        var groupService = new Mock<IStudentGroupService>();
        groupService.Setup(s => s.AddAsync(It.IsAny<CreateStudentGroupDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StudentGroup
            {
                Id = Guid.NewGuid(),
                Name = "G1",
                FieldOfStudy = "CS",
                StudyType = StudyType.Stacjonarne,
                Semester = 1,
                StarostaId = Guid.NewGuid()
            });
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = new StudentGroupController(groupService.Object, mapper);

        var result = await controller.AddGroup(new CreateStudentGroupDto
        {
            Name = "G1",
            FieldOfStudy = "CS",
            StudyType = StudyType.Stacjonarne,
            Semester = 1,
            StarostaId = Guid.NewGuid()
        }, default);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task ExamSessionController_GetById_ReturnsNotFound_WhenMissing()
    {
        var sessionService = new Mock<IExamSessionService>();
        sessionService.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ExamSession?)null);
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = new ExamSessionController(sessionService.Object, mapper);

        var result = await controller.GetById(Guid.NewGuid(), default);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task ExamTermHistoryController_List_ReturnsOk_ForExamTermId()
    {
        var termId = Guid.NewGuid();
        var historyService = new Mock<IExamTermHistoryService>();
        historyService.Setup(s => s.ListByExamTermAsync(termId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new ExamTermHistory
                {
                    Id = Guid.NewGuid(),
                    ExamTermId = termId,
                    ChangedBy = Guid.NewGuid(),
                    ChangedAt = DateTime.UtcNow,
                    PreviousStatus = ExamTermStatus.Draft,
                    NewStatus = ExamTermStatus.Approved
                }
            });
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = new ExamTermHistoryController(historyService.Object, mapper);

        var result = await controller.List(termId, cancellationToken: default);

        result.Should().BeOfType<OkObjectResult>();
    }
}
