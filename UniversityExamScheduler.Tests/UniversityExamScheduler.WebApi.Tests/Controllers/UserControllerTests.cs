using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos;
using UniversityExamScheduler.Application.Dtos.User.Request;
using UniversityExamScheduler.Application.Dtos.User.Respone;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.WebApi.Controllers;
using UniversityExamScheduler.WebApi.Tests.Helpers;

namespace UniversityExamScheduler.WebApi.Tests.Controllers;

public class UserControllerTests
{
    [Fact]
    public async Task AddUser_ReturnsCreatedAtAction()
    {
        var userId = Guid.NewGuid();
        var userService = new Mock<IUserService>();
        userService.Setup(s => s.AddAsync(It.IsAny<CreateUserDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                Email = "user@example.com",
                FirstName = "Jan",
                LastName = "Kowalski",
                Role = Role.Student
            });
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = new UserController(userService.Object, mapper);

        var result = await controller.AddUser(new CreateUserDto
        {
            Email = "user@example.com",
            FirstName = "Jan",
            LastName = "Kowalski",
            Role = Role.Student
        }, default);

        var created = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.RouteValues.Should().ContainKey("id").WhoseValue.Should().Be(userId);
        created.Value.Should().BeOfType<GetUserDto>();
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        var userService = new Mock<IUserService>();
        userService.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = new UserController(userService.Object, mapper);

        var result = await controller.GetById(Guid.NewGuid(), default);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetByEmail_ReturnsPagedResult_WhenSearchProvided()
    {
        var userService = new Mock<IUserService>();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            FirstName = "Jan",
            LastName = "Kowalski",
            Role = Role.Student
        };
        userService.Setup(s => s.SearchAsync("test", 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync((new[] { user }, 1));
        var mapper = ControllerTestHelper.CreateMapper();
        var controller = new UserController(userService.Object, mapper);

        var result = await controller.GetByEmail(null, "test", 0, 0, default);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var paged = ok.Value.Should().BeOfType<PagedResult<GetUserDto>>().Subject;
        paged.TotalCount.Should().Be(1);
        paged.Page.Should().Be(1);
        paged.PageSize.Should().Be(20);
    }
}
