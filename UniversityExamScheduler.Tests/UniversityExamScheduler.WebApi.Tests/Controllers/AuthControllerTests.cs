using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.WebApi.Controllers;
using UniversityExamScheduler.WebApi.Tests.Helpers;

namespace UniversityExamScheduler.WebApi.Tests.Controllers;

public class AuthControllerTests
{
    [Fact]
    public async Task Login_ReturnsUnauthorized_ForUnknownUser()
    {
        var controller = new AuthController(BuildConfig(), new Mock<IUserService>().Object);

        var result = await controller.Login(new AuthController.LoginRequest("unknown", "pass"), default);

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Login_ReturnsServerError_WhenJwtMissing()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Jwt:Key"] = new string('a', 32) })
            .Build();
        var controller = new AuthController(config, new Mock<IUserService>().Object);

        var result = await controller.Login(new AuthController.LoginRequest("student", "pass"), default);

        var status = result.Result.Should().BeOfType<ObjectResult>().Subject;
        status.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task Login_ReturnsServerError_WhenKeyTooShort()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Issuer"] = "issuer",
                ["Jwt:Audience"] = "audience",
                ["Jwt:Key"] = "short-key",
                ["Jwt:ExpiresMinutes"] = "60"
            })
            .Build();
        var controller = new AuthController(config, new Mock<IUserService>().Object);

        var result = await controller.Login(new AuthController.LoginRequest("student", "pass"), default);

        var status = result.Result.Should().BeOfType<ObjectResult>().Subject;
        status.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task Login_ReturnsOk_ForKnownUser()
    {
        var controller = new AuthController(BuildConfig(), new Mock<IUserService>().Object);

        var result = await controller.Login(new AuthController.LoginRequest("student", "pass"), default);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var payload = ok.Value.Should().BeOfType<AuthController.LoginResponse>().Subject;
        payload.AccessToken.Should().NotBeNullOrWhiteSpace();
        payload.User.Username.Should().Be("student");
    }

    [Fact]
    public async Task Me_ReturnsUnauthorized_WhenClaimsMissing()
    {
        var controller = ControllerTestHelper.WithUser(
            new AuthController(BuildConfig(), new Mock<IUserService>().Object),
            new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity()));

        var result = await controller.Me(default);

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Me_ReturnsOk_WithDbUser()
    {
        var userId = Guid.NewGuid();
        var userService = new Mock<IUserService>();
        userService.Setup(s => s.GetByIdWithGroupsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                Email = "db@example.com",
                FirstName = "Jan",
                LastName = "Kowalski",
                Role = Role.Admin,
                IsStarosta = true
            });

        var controller = ControllerTestHelper.WithUser(
            new AuthController(BuildConfig(), userService.Object),
            ControllerTestHelper.BuildUser(Role.Student, userId, isStarosta: false, name: "student"));

        var result = await controller.Me(default);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var payload = ok.Value.Should().BeOfType<AuthController.UserDto>().Subject;
        payload.Role.Should().Be(Role.Admin);
        payload.IsStarosta.Should().BeTrue();
    }

    private static IConfiguration BuildConfig()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Issuer"] = "issuer",
                ["Jwt:Audience"] = "audience",
                ["Jwt:Key"] = new string('a', 32),
                ["Jwt:ExpiresMinutes"] = "60"
            })
            .Build();
    }
}
