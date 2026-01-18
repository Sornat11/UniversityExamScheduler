using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.Room.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Application.Mapping;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Tests.Services;

public class RoomServiceTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        return config.CreateMapper();
    }

    private static (Mock<IUnitOfWork> Uow, Mock<IRoomRepository> RoomRepo) BuildUow()
    {
        var uow = new Mock<IUnitOfWork>();
        var roomRepo = new Mock<IRoomRepository>();

        uow.SetupGet(x => x.Rooms).Returns(roomRepo.Object);
        uow.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        return (uow, roomRepo);
    }

    private static CreateRoomDto CreateValidDto() => new()
    {
        RoomNumber = "A-101",
        Capacity = 30,
        Type = RoomType.Lecture,
        IsAvailable = true
    };

    [Fact]
    public async Task AddAsync_WhenRoomExists_ThrowsEntityAlreadyExistsException()
    {
        var (uow, roomRepo) = BuildUow();
        var dto = CreateValidDto();

        roomRepo
            .Setup(x => x.GetByRoomNumberAsync(dto.RoomNumber, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Room { RoomNumber = dto.RoomNumber });

        var service = new RoomService(uow.Object, CreateMapper());

        Func<Task> act = () => service.AddAsync(dto);

        await act.Should().ThrowAsync<EntityAlreadyExistsException>()
            .WithMessage($"Room '{dto.RoomNumber}' already exists.");
    }

    [Fact]
    public async Task AddAsync_WhenValid_AddsAndSaves()
    {
        var (uow, roomRepo) = BuildUow();
        var dto = CreateValidDto();

        roomRepo
            .Setup(x => x.GetByRoomNumberAsync(dto.RoomNumber, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Room?)null);

        var service = new RoomService(uow.Object, CreateMapper());

        var result = await service.AddAsync(dto);

        result.Id.Should().NotBe(Guid.Empty);
        result.RoomNumber.Should().Be(dto.RoomNumber);

        roomRepo.Verify(x => x.AddAsync(It.Is<Room>(r =>
            r.RoomNumber == dto.RoomNumber &&
            r.Capacity == dto.Capacity &&
            r.Type == dto.Type &&
            r.IsAvailable == dto.IsAvailable), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var (uow, roomRepo) = BuildUow();
        var roomId = Guid.NewGuid();
        var dto = new UpdateRoomDto
        {
            RoomNumber = "B-203",
            Capacity = 40,
            Type = RoomType.Lab,
            IsAvailable = false
        };

        roomRepo.Setup(x => x.GetByIdAsync(roomId)).ReturnsAsync((Room?)null);

        var service = new RoomService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(roomId, dto);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Room with ID '{roomId}' not found.");
    }

    [Fact]
    public async Task UpdateAsync_WhenValid_UpdatesAndSaves()
    {
        var (uow, roomRepo) = BuildUow();
        var roomId = Guid.NewGuid();
        var dto = new UpdateRoomDto
        {
            RoomNumber = "B-203",
            Capacity = 40,
            Type = RoomType.Lab,
            IsAvailable = false
        };

        roomRepo.Setup(x => x.GetByIdAsync(roomId)).ReturnsAsync(new Room { Id = roomId });

        var service = new RoomService(uow.Object, CreateMapper());

        await service.UpdateAsync(roomId, dto);

        roomRepo.Verify(x => x.UpdateAsync(It.Is<Room>(r =>
            r.Id == roomId &&
            r.RoomNumber == dto.RoomNumber &&
            r.Capacity == dto.Capacity &&
            r.Type == dto.Type &&
            r.IsAvailable == dto.IsAvailable), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var (uow, roomRepo) = BuildUow();
        var roomId = Guid.NewGuid();

        roomRepo.Setup(x => x.GetByIdAsync(roomId)).ReturnsAsync((Room?)null);

        var service = new RoomService(uow.Object, CreateMapper());

        Func<Task> act = () => service.RemoveAsync(roomId);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Room with ID '{roomId}' not found.");
    }

    [Fact]
    public async Task RemoveAsync_WhenValid_RemovesAndSaves()
    {
        var (uow, roomRepo) = BuildUow();
        var roomId = Guid.NewGuid();
        var existing = new Room { Id = roomId };

        roomRepo.Setup(x => x.GetByIdAsync(roomId)).ReturnsAsync(existing);

        var service = new RoomService(uow.Object, CreateMapper());

        await service.RemoveAsync(roomId);

        roomRepo.Verify(x => x.RemoveAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
