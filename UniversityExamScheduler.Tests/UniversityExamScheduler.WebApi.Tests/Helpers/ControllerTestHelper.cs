using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Mapping;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.WebApi.Tests.Helpers;

public static class ControllerTestHelper
{
    public static ClaimsPrincipal BuildUser(Role role, Guid? userId = null, bool isStarosta = false, string? name = "user")
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Role, role.ToString())
        };

        if (!string.IsNullOrWhiteSpace(name))
        {
            claims.Add(new Claim(ClaimTypes.Name, name));
        }

        if (userId.HasValue)
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()));
        }

        if (isStarosta)
        {
            claims.Add(new Claim("is_starosta", "true"));
        }

        var identity = new ClaimsIdentity(claims, "Test");
        return new ClaimsPrincipal(identity);
    }

    public static T WithUser<T>(T controller, ClaimsPrincipal user) where T : ControllerBase
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        return controller;
    }

    public static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        return config.CreateMapper();
    }
}
