using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.Exam.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Application.Mapping;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Tests.Services;

public class ExamServiceTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        return config.CreateMapper();
    }

    private static (Mock<IUnitOfWork> Uow, Mock<IExamRepository> ExamRepo) BuildUow()
    {
        var uow = new Mock<IUnitOfWork>();
        var examRepo = new Mock<IExamRepository>();

        uow.SetupGet(x => x.Exams).Returns(examRepo.Object);
        uow.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        return (uow, examRepo);
    }

    private static CreateExamDto CreateValidDto() => new()
    {
        Name = "Algorithms",
        LecturerId = Guid.NewGuid(),
        GroupId = Guid.NewGuid()
    };

    [Fact]
    public async Task AddAsync_WhenValid_AddsExamAndSaves()
    {
        var (uow, examRepo) = BuildUow();
        var service = new ExamService(uow.Object, CreateMapper());
        var dto = CreateValidDto();

        var result = await service.AddAsync(dto);

        result.Id.Should().NotBe(Guid.Empty);
        result.Name.Should().Be(dto.Name);

        examRepo.Verify(x => x.AddAsync(It.Is<Exam>(e =>
            e.Name == dto.Name &&
            e.LecturerId == dto.LecturerId &&
            e.GroupId == dto.GroupId), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var (uow, examRepo) = BuildUow();
        var examId = Guid.NewGuid();
        var dto = new UpdateExamDto
        {
            Name = "Databases",
            LecturerId = Guid.NewGuid(),
            GroupId = Guid.NewGuid()
        };

        examRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync((Exam?)null);

        var service = new ExamService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(examId, dto);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Exam with ID '{examId}' not found.");
    }

    [Fact]
    public async Task UpdateAsync_WhenValid_UpdatesAndSaves()
    {
        var (uow, examRepo) = BuildUow();
        var examId = Guid.NewGuid();
        var existing = new Exam { Id = examId, Name = "Old", LecturerId = Guid.NewGuid(), GroupId = Guid.NewGuid() };
        var dto = new UpdateExamDto
        {
            Name = "New name",
            LecturerId = Guid.NewGuid(),
            GroupId = Guid.NewGuid()
        };

        examRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(existing);

        var service = new ExamService(uow.Object, CreateMapper());

        await service.UpdateAsync(examId, dto);

        examRepo.Verify(x => x.UpdateAsync(It.Is<Exam>(e =>
            e.Id == examId &&
            e.Name == dto.Name &&
            e.LecturerId == dto.LecturerId &&
            e.GroupId == dto.GroupId), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var (uow, examRepo) = BuildUow();
        var examId = Guid.NewGuid();

        examRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync((Exam?)null);

        var service = new ExamService(uow.Object, CreateMapper());

        Func<Task> act = () => service.RemoveAsync(examId);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Exam with ID '{examId}' not found.");
    }

    [Fact]
    public async Task RemoveAsync_WhenValid_RemovesAndSaves()
    {
        var (uow, examRepo) = BuildUow();
        var examId = Guid.NewGuid();
        var existing = new Exam { Id = examId };

        examRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(existing);

        var service = new ExamService(uow.Object, CreateMapper());

        await service.RemoveAsync(examId);

        examRepo.Verify(x => x.RemoveAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
