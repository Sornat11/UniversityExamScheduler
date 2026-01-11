using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Application.Mapping;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Tests.Services;

public class ExamTermHistoryServiceTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        return config.CreateMapper();
    }

    private static (Mock<IUnitOfWork> Uow, Mock<IExamTermHistoryRepository> HistoryRepo, Mock<IExamTermRepository> TermRepo)
        BuildUow()
    {
        var uow = new Mock<IUnitOfWork>();
        var historyRepo = new Mock<IExamTermHistoryRepository>();
        var termRepo = new Mock<IExamTermRepository>();

        uow.SetupGet(x => x.ExamTermHistories).Returns(historyRepo.Object);
        uow.SetupGet(x => x.ExamTerms).Returns(termRepo.Object);
        uow.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        return (uow, historyRepo, termRepo);
    }

    private static CreateExamTermHistoryDto CreateValidDto(Guid termId) => new()
    {
        ExamTermId = termId,
        ChangedBy = Guid.NewGuid(),
        ChangedAt = default,
        PreviousStatus = ExamTermStatus.Draft,
        NewStatus = ExamTermStatus.Approved,
        PreviousDate = null,
        NewDate = null,
        Comment = "Status update"
    };

    [Fact]
    public async Task AddAsync_WhenTermMissing_ThrowsEntityNotFoundException()
    {
        var (uow, _, termRepo) = BuildUow();
        var termId = Guid.NewGuid();
        var dto = CreateValidDto(termId);

        termRepo.Setup(x => x.GetByIdAsync(termId)).ReturnsAsync((ExamTerm?)null);

        var service = new ExamTermHistoryService(uow.Object, CreateMapper());

        Func<Task> act = () => service.AddAsync(dto);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Exam term with ID '{termId}' not found.");
    }

    [Fact]
    public async Task AddAsync_WhenValid_AddsAndSaves()
    {
        var (uow, historyRepo, termRepo) = BuildUow();
        var termId = Guid.NewGuid();
        var dto = CreateValidDto(termId);

        termRepo.Setup(x => x.GetByIdAsync(termId)).ReturnsAsync(new ExamTerm { Id = termId });

        var service = new ExamTermHistoryService(uow.Object, CreateMapper());

        var result = await service.AddAsync(dto);

        result.Id.Should().NotBe(Guid.Empty);
        result.ChangedAt.Should().NotBe(default);

        historyRepo.Verify(x => x.AddAsync(It.Is<ExamTermHistory>(h =>
            h.ExamTermId == termId &&
            h.ChangedBy == dto.ChangedBy &&
            h.NewStatus == dto.NewStatus &&
            h.PreviousStatus == dto.PreviousStatus), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenTermMissing_ThrowsEntityNotFoundException()
    {
        var (uow, _, termRepo) = BuildUow();
        var termId = Guid.NewGuid();
        var historyId = Guid.NewGuid();
        var dto = new UpdateExamTermHistoryDto
        {
            ExamTermId = termId,
            ChangedBy = Guid.NewGuid(),
            ChangedAt = DateTime.UtcNow,
            PreviousStatus = ExamTermStatus.Draft,
            NewStatus = ExamTermStatus.Approved
        };

        termRepo.Setup(x => x.GetByIdAsync(termId)).ReturnsAsync((ExamTerm?)null);

        var service = new ExamTermHistoryService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(historyId, dto);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Exam term with ID '{termId}' not found.");
    }

    [Fact]
    public async Task UpdateAsync_WhenHistoryMissing_ThrowsEntityNotFoundException()
    {
        var (uow, historyRepo, termRepo) = BuildUow();
        var termId = Guid.NewGuid();
        var historyId = Guid.NewGuid();
        var dto = new UpdateExamTermHistoryDto
        {
            ExamTermId = termId,
            ChangedBy = Guid.NewGuid(),
            ChangedAt = DateTime.UtcNow,
            PreviousStatus = ExamTermStatus.Draft,
            NewStatus = ExamTermStatus.Approved
        };

        termRepo.Setup(x => x.GetByIdAsync(termId)).ReturnsAsync(new ExamTerm { Id = termId });
        historyRepo.Setup(x => x.GetByIdAsync(historyId)).ReturnsAsync((ExamTermHistory?)null);

        var service = new ExamTermHistoryService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(historyId, dto);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Exam term history with ID '{historyId}' not found.");
    }

    [Fact]
    public async Task UpdateAsync_WhenValid_UpdatesAndSaves()
    {
        var (uow, historyRepo, termRepo) = BuildUow();
        var termId = Guid.NewGuid();
        var historyId = Guid.NewGuid();
        var dto = new UpdateExamTermHistoryDto
        {
            ExamTermId = termId,
            ChangedBy = Guid.NewGuid(),
            ChangedAt = DateTime.UtcNow,
            PreviousStatus = ExamTermStatus.ProposedByLecturer,
            NewStatus = ExamTermStatus.Approved,
            Comment = "Approved"
        };

        termRepo.Setup(x => x.GetByIdAsync(termId)).ReturnsAsync(new ExamTerm { Id = termId });
        historyRepo.Setup(x => x.GetByIdAsync(historyId)).ReturnsAsync(new ExamTermHistory { Id = historyId });

        var service = new ExamTermHistoryService(uow.Object, CreateMapper());

        await service.UpdateAsync(historyId, dto);

        historyRepo.Verify(x => x.UpdateAsync(It.Is<ExamTermHistory>(h =>
            h.Id == historyId &&
            h.ExamTermId == termId &&
            h.NewStatus == dto.NewStatus &&
            h.PreviousStatus == dto.PreviousStatus &&
            h.Comment == dto.Comment), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var (uow, historyRepo, _) = BuildUow();
        var historyId = Guid.NewGuid();

        historyRepo.Setup(x => x.GetByIdAsync(historyId)).ReturnsAsync((ExamTermHistory?)null);

        var service = new ExamTermHistoryService(uow.Object, CreateMapper());

        Func<Task> act = () => service.RemoveAsync(historyId);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Exam term history with ID '{historyId}' not found.");
    }

    [Fact]
    public async Task RemoveAsync_WhenValid_RemovesAndSaves()
    {
        var (uow, historyRepo, _) = BuildUow();
        var historyId = Guid.NewGuid();
        var existing = new ExamTermHistory { Id = historyId };

        historyRepo.Setup(x => x.GetByIdAsync(historyId)).ReturnsAsync(existing);

        var service = new ExamTermHistoryService(uow.Object, CreateMapper());

        await service.RemoveAsync(historyId);

        historyRepo.Verify(x => x.RemoveAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
