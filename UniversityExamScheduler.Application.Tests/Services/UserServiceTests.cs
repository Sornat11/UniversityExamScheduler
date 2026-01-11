using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.User.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Application.Mapping;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Tests.Services;

public class UserServiceTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        return config.CreateMapper();
    }

    private static (Mock<IUnitOfWork> Uow, Mock<IUserRepository> UserRepo) BuildUow()
    {
        var uow = new Mock<IUnitOfWork>();
        var userRepo = new Mock<IUserRepository>();

        uow.SetupGet(x => x.Users).Returns(userRepo.Object);
        uow.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        return (uow, userRepo);
    }

    private static CreateUserDto CreateValidCreateDto() => new()
    {
        Email = "student@example.com",
        FirstName = "Jan",
        LastName = "Kowalski",
        Role = Role.Student,
        IsStarosta = false,
        IsActive = true
    };

    [Fact]
    public async Task AddAsync_WhenEmailExists_ThrowsEntityAlreadyExistsException()
    {
        var (uow, userRepo) = BuildUow();
        var dto = CreateValidCreateDto();

        userRepo
            .Setup(x => x.GetByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Email = dto.Email });

        var service = new UserService(uow.Object, CreateMapper());

        Func<Task> act = () => service.AddAsync(dto);

        await act.Should().ThrowAsync<EntityAlreadyExistsException>()
            .WithMessage($"User with email '{dto.Email}' already exists.");
    }

    [Fact]
    public async Task AddAsync_WhenStarostaNotStudent_ThrowsBusinessRuleException()
    {
        var (uow, userRepo) = BuildUow();
        var dto = CreateValidCreateDto();
        dto.Role = Role.DeanOffice;
        dto.IsStarosta = true;

        userRepo
            .Setup(x => x.GetByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var service = new UserService(uow.Object, CreateMapper());

        Func<Task> act = () => service.AddAsync(dto);

        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Only students can be marked as starosta.");
    }

    [Fact]
    public async Task RemoveAsync_WhenLastDeanOffice_ThrowsBusinessRuleException()
    {
        var (uow, userRepo) = BuildUow();
        var userId = Guid.NewGuid();

        userRepo
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(new User { Id = userId, Role = Role.DeanOffice });

        userRepo
            .Setup(x => x.CountByRoleAsync(Role.DeanOffice, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var service = new UserService(uow.Object, CreateMapper());

        Func<Task> act = () => service.RemoveAsync(userId);

        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Cannot remove the last user with the DeanOffice role.");
    }

    [Fact]
    public async Task UpdateAsync_WhenLastDeanOfficeRoleRemoved_ThrowsBusinessRuleException()
    {
        var (uow, userRepo) = BuildUow();
        var userId = Guid.NewGuid();
        var dto = new UpdateUserDto
        {
            Email = "dean@example.com",
            FirstName = "Anna",
            LastName = "Nowak",
            Role = Role.Student,
            IsStarosta = false,
            IsActive = true
        };

        userRepo
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(new User { Id = userId, Role = Role.DeanOffice });

        userRepo
            .Setup(x => x.CountByRoleAsync(Role.DeanOffice, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var service = new UserService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(userId, dto);

        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Cannot remove the DeanOffice role from the last dean's office user.");
    }

    [Fact]
    public async Task UpdateAsync_WhenStarostaNotStudent_ThrowsBusinessRuleException()
    {
        var (uow, userRepo) = BuildUow();
        var userId = Guid.NewGuid();
        var dto = new UpdateUserDto
        {
            Email = "user@example.com",
            FirstName = "Piotr",
            LastName = "Zielinski",
            Role = Role.DeanOffice,
            IsStarosta = true,
            IsActive = true
        };

        userRepo
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(new User { Id = userId, Role = Role.Student });

        var service = new UserService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(userId, dto);

        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Only students can be marked as starosta.");
    }
}
