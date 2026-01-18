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
    public async Task AddAsync_WhenValid_AddsAndSaves()
    {
        var (uow, userRepo) = BuildUow();
        var dto = CreateValidCreateDto();

        userRepo
            .Setup(x => x.GetByEmailAsync(dto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var service = new UserService(uow.Object, CreateMapper());

        var result = await service.AddAsync(dto);

        result.Id.Should().NotBe(Guid.Empty);
        result.Email.Should().Be(dto.Email);

        userRepo.Verify(x => x.AddAsync(It.Is<User>(u =>
            u.Email == dto.Email &&
            u.FirstName == dto.FirstName &&
            u.LastName == dto.LastName &&
            u.Role == dto.Role &&
            u.IsStarosta == dto.IsStarosta &&
            u.IsActive == dto.IsActive), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
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
    public async Task RemoveAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var (uow, userRepo) = BuildUow();
        var userId = Guid.NewGuid();

        userRepo
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync((User?)null);

        var service = new UserService(uow.Object, CreateMapper());

        Func<Task> act = () => service.RemoveAsync(userId);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"User with ID '{userId}' not found.");
    }

    [Fact]
    public async Task RemoveAsync_WhenValid_RemovesAndSaves()
    {
        var (uow, userRepo) = BuildUow();
        var userId = Guid.NewGuid();
        var existing = new User { Id = userId, Role = Role.Student };

        userRepo
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(existing);

        var service = new UserService(uow.Object, CreateMapper());

        await service.RemoveAsync(userId);

        userRepo.Verify(x => x.RemoveAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
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

    [Fact]
    public async Task UpdateAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var (uow, userRepo) = BuildUow();
        var userId = Guid.NewGuid();
        var dto = new UpdateUserDto
        {
            Email = "user@example.com",
            FirstName = "Piotr",
            LastName = "Zielinski",
            Role = Role.Student,
            IsStarosta = false,
            IsActive = true
        };

        userRepo
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync((User?)null);

        var service = new UserService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(userId, dto);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"User with ID '{userId}' not found.");
    }

    [Fact]
    public async Task UpdateAsync_WhenValid_UpdatesAndSaves()
    {
        var (uow, userRepo) = BuildUow();
        var userId = Guid.NewGuid();
        var dto = new UpdateUserDto
        {
            Email = "user@example.com",
            FirstName = "Piotr",
            LastName = "Zielinski",
            Role = Role.Student,
            IsStarosta = false,
            IsActive = true
        };

        userRepo
            .Setup(x => x.GetByIdAsync(userId))
            .ReturnsAsync(new User { Id = userId, Role = Role.Student });

        var service = new UserService(uow.Object, CreateMapper());

        await service.UpdateAsync(userId, dto);

        userRepo.Verify(x => x.UpdateAsync(It.Is<User>(u =>
            u.Id == userId &&
            u.Email == dto.Email &&
            u.FirstName == dto.FirstName &&
            u.LastName == dto.LastName &&
            u.Role == dto.Role &&
            u.IsStarosta == dto.IsStarosta &&
            u.IsActive == dto.IsActive), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
