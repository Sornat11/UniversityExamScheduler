using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Application.Mapping;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Tests.Services;

public class StudentGroupServiceTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        return config.CreateMapper();
    }

    private static (Mock<IUnitOfWork> Uow, Mock<IStudentGroupRepository> GroupRepo) BuildUow()
    {
        var uow = new Mock<IUnitOfWork>();
        var groupRepo = new Mock<IStudentGroupRepository>();

        uow.SetupGet(x => x.StudentGroups).Returns(groupRepo.Object);
        uow.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        return (uow, groupRepo);
    }

    private static CreateStudentGroupDto CreateValidDto() => new()
    {
        Name = "INF-1",
        FieldOfStudy = "Computer Science",
        StudyType = StudyType.Stacjonarne,
        Semester = 1,
        StarostaId = Guid.NewGuid()
    };

    [Fact]
    public async Task AddAsync_WhenGroupExists_ThrowsEntityAlreadyExistsException()
    {
        var (uow, groupRepo) = BuildUow();
        var dto = CreateValidDto();

        groupRepo
            .Setup(x => x.GetByNameAsync(dto.Name, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StudentGroup { Name = dto.Name });

        var service = new StudentGroupService(uow.Object, CreateMapper());

        Func<Task> act = () => service.AddAsync(dto);

        await act.Should().ThrowAsync<EntityAlreadyExistsException>()
            .WithMessage($"Student group '{dto.Name}' already exists.");
    }

    [Fact]
    public async Task AddAsync_WhenValid_AddsAndSaves()
    {
        var (uow, groupRepo) = BuildUow();
        var dto = CreateValidDto();

        groupRepo
            .Setup(x => x.GetByNameAsync(dto.Name, It.IsAny<CancellationToken>()))
            .ReturnsAsync((StudentGroup?)null);

        var service = new StudentGroupService(uow.Object, CreateMapper());

        var result = await service.AddAsync(dto);

        result.Id.Should().NotBe(Guid.Empty);
        result.Name.Should().Be(dto.Name);

        groupRepo.Verify(x => x.AddAsync(It.Is<StudentGroup>(g =>
            g.Name == dto.Name &&
            g.FieldOfStudy == dto.FieldOfStudy &&
            g.StudyType == dto.StudyType &&
            g.Semester == dto.Semester &&
            g.StarostaId == dto.StarostaId), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var (uow, groupRepo) = BuildUow();
        var groupId = Guid.NewGuid();
        var dto = new UpdateStudentGroupDto
        {
            Name = "INF-2",
            FieldOfStudy = "Computer Science",
            StudyType = StudyType.Stacjonarne,
            Semester = 2,
            StarostaId = Guid.NewGuid()
        };

        groupRepo.Setup(x => x.GetByIdAsync(groupId)).ReturnsAsync((StudentGroup?)null);

        var service = new StudentGroupService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(groupId, dto);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Student group with ID '{groupId}' not found.");
    }

    [Fact]
    public async Task UpdateAsync_WhenValid_UpdatesAndSaves()
    {
        var (uow, groupRepo) = BuildUow();
        var groupId = Guid.NewGuid();
        var dto = new UpdateStudentGroupDto
        {
            Name = "INF-2",
            FieldOfStudy = "Computer Science",
            StudyType = StudyType.Stacjonarne,
            Semester = 2,
            StarostaId = Guid.NewGuid()
        };

        groupRepo.Setup(x => x.GetByIdAsync(groupId)).ReturnsAsync(new StudentGroup { Id = groupId });

        var service = new StudentGroupService(uow.Object, CreateMapper());

        await service.UpdateAsync(groupId, dto);

        groupRepo.Verify(x => x.UpdateAsync(It.Is<StudentGroup>(g =>
            g.Id == groupId &&
            g.Name == dto.Name &&
            g.FieldOfStudy == dto.FieldOfStudy &&
            g.StudyType == dto.StudyType &&
            g.Semester == dto.Semester &&
            g.StarostaId == dto.StarostaId), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var (uow, groupRepo) = BuildUow();
        var groupId = Guid.NewGuid();

        groupRepo.Setup(x => x.GetByIdAsync(groupId)).ReturnsAsync((StudentGroup?)null);

        var service = new StudentGroupService(uow.Object, CreateMapper());

        Func<Task> act = () => service.RemoveAsync(groupId);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Student group with ID '{groupId}' not found.");
    }

    [Fact]
    public async Task RemoveAsync_WhenValid_RemovesAndSaves()
    {
        var (uow, groupRepo) = BuildUow();
        var groupId = Guid.NewGuid();
        var existing = new StudentGroup { Id = groupId };

        groupRepo.Setup(x => x.GetByIdAsync(groupId)).ReturnsAsync(existing);

        var service = new StudentGroupService(uow.Object, CreateMapper());

        await service.RemoveAsync(groupId);

        groupRepo.Verify(x => x.RemoveAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
