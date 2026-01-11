using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.ExamSession.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Application.Mapping;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Tests.Services;

public class ExamSessionServiceTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        return config.CreateMapper();
    }

    private static (Mock<IUnitOfWork> Uow, Mock<IExamSessionRepository> SessionRepo, Mock<IExamTermRepository> TermRepo)
        BuildUow()
    {
        var uow = new Mock<IUnitOfWork>();
        var sessionRepo = new Mock<IExamSessionRepository>();
        var termRepo = new Mock<IExamTermRepository>();

        uow.SetupGet(x => x.ExamSessions).Returns(sessionRepo.Object);
        uow.SetupGet(x => x.ExamTerms).Returns(termRepo.Object);
        uow.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        return (uow, sessionRepo, termRepo);
    }

    private static CreateExamSessionDto CreateValidDto(DateOnly start, DateOnly end) => new()
    {
        Name = "Winter 2026",
        StartDate = start,
        EndDate = end,
        IsActive = true
    };

    [Fact]
    public async Task AddAsync_WhenStartAfterEnd_ThrowsBusinessRuleException()
    {
        var (uow, _, _) = BuildUow();
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var dto = CreateValidDto(today.AddDays(5), today);

        var service = new ExamSessionService(uow.Object, CreateMapper());

        Func<Task> act = () => service.AddAsync(dto);

        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Session start date must be on or before end date.");
    }

    [Fact]
    public async Task AddAsync_WhenOverlaps_ThrowsBusinessRuleException()
    {
        var (uow, sessionRepo, _) = BuildUow();
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var dto = CreateValidDto(today, today.AddDays(10));

        sessionRepo
            .Setup(x => x.OverlapsAsync(dto.StartDate, dto.EndDate, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var service = new ExamSessionService(uow.Object, CreateMapper());

        Func<Task> act = () => service.AddAsync(dto);

        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Exam session dates cannot overlap with an existing session.");
    }

    [Fact]
    public async Task AddAsync_WhenValid_AddsAndSaves()
    {
        var (uow, sessionRepo, _) = BuildUow();
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var dto = CreateValidDto(today, today.AddDays(10));

        sessionRepo
            .Setup(x => x.OverlapsAsync(dto.StartDate, dto.EndDate, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var service = new ExamSessionService(uow.Object, CreateMapper());

        var result = await service.AddAsync(dto);

        result.Id.Should().NotBe(Guid.Empty);
        result.Name.Should().Be(dto.Name);

        sessionRepo.Verify(x => x.AddAsync(It.Is<ExamSession>(s =>
            s.Name == dto.Name &&
            s.StartDate == dto.StartDate &&
            s.EndDate == dto.EndDate &&
            s.IsActive == dto.IsActive), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenStartAfterEnd_ThrowsBusinessRuleException()
    {
        var (uow, _, _) = BuildUow();
        var dto = new UpdateExamSessionDto
        {
            Name = "Invalid",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(3)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(1)),
            IsActive = false
        };

        var service = new ExamSessionService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(Guid.NewGuid(), dto);

        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Session start date must be on or before end date.");
    }

    [Fact]
    public async Task UpdateAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var (uow, sessionRepo, _) = BuildUow();
        var sessionId = Guid.NewGuid();
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var dto = new UpdateExamSessionDto
        {
            Name = "Spring 2026",
            StartDate = today,
            EndDate = today.AddDays(5),
            IsActive = true
        };

        sessionRepo.Setup(x => x.GetByIdAsync(sessionId)).ReturnsAsync((ExamSession?)null);

        var service = new ExamSessionService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(sessionId, dto);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Exam session with ID '{sessionId}' not found.");
    }

    [Fact]
    public async Task UpdateAsync_WhenOverlaps_ThrowsBusinessRuleException()
    {
        var (uow, sessionRepo, _) = BuildUow();
        var sessionId = Guid.NewGuid();
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var dto = new UpdateExamSessionDto
        {
            Name = "Spring 2026",
            StartDate = today,
            EndDate = today.AddDays(10),
            IsActive = true
        };

        sessionRepo.Setup(x => x.GetByIdAsync(sessionId))
            .ReturnsAsync(new ExamSession { Id = sessionId, StartDate = today, EndDate = today.AddDays(5) });
        sessionRepo
            .Setup(x => x.OverlapsAsync(dto.StartDate, dto.EndDate, sessionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var service = new ExamSessionService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(sessionId, dto);

        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Exam session dates cannot overlap with an existing session.");
    }

    [Fact]
    public async Task UpdateAsync_WhenHasOutsideTerms_ThrowsBusinessRuleException()
    {
        var (uow, sessionRepo, termRepo) = BuildUow();
        var sessionId = Guid.NewGuid();
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var dto = new UpdateExamSessionDto
        {
            Name = "Spring 2026",
            StartDate = today,
            EndDate = today.AddDays(10),
            IsActive = true
        };

        sessionRepo.Setup(x => x.GetByIdAsync(sessionId))
            .ReturnsAsync(new ExamSession { Id = sessionId, StartDate = today, EndDate = today.AddDays(5) });
        sessionRepo
            .Setup(x => x.OverlapsAsync(dto.StartDate, dto.EndDate, sessionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        termRepo
            .Setup(x => x.ExistsOutsideSessionAsync(sessionId, dto.StartDate, dto.EndDate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var service = new ExamSessionService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(sessionId, dto);

        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Cannot set dates that exclude existing exam terms for this session.");
    }

    [Fact]
    public async Task UpdateAsync_WhenValid_UpdatesAndSaves()
    {
        var (uow, sessionRepo, termRepo) = BuildUow();
        var sessionId = Guid.NewGuid();
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var dto = new UpdateExamSessionDto
        {
            Name = "Spring 2026",
            StartDate = today,
            EndDate = today.AddDays(10),
            IsActive = true
        };

        sessionRepo.Setup(x => x.GetByIdAsync(sessionId))
            .ReturnsAsync(new ExamSession { Id = sessionId, StartDate = today, EndDate = today.AddDays(5) });
        sessionRepo
            .Setup(x => x.OverlapsAsync(dto.StartDate, dto.EndDate, sessionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        termRepo
            .Setup(x => x.ExistsOutsideSessionAsync(sessionId, dto.StartDate, dto.EndDate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var service = new ExamSessionService(uow.Object, CreateMapper());

        await service.UpdateAsync(sessionId, dto);

        sessionRepo.Verify(x => x.UpdateAsync(It.Is<ExamSession>(s =>
            s.Id == sessionId &&
            s.Name == dto.Name &&
            s.StartDate == dto.StartDate &&
            s.EndDate == dto.EndDate &&
            s.IsActive == dto.IsActive), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var (uow, sessionRepo, _) = BuildUow();
        var sessionId = Guid.NewGuid();

        sessionRepo.Setup(x => x.GetByIdAsync(sessionId)).ReturnsAsync((ExamSession?)null);

        var service = new ExamSessionService(uow.Object, CreateMapper());

        Func<Task> act = () => service.RemoveAsync(sessionId);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Exam session with ID '{sessionId}' not found.");
    }

    [Fact]
    public async Task RemoveAsync_WhenValid_RemovesAndSaves()
    {
        var (uow, sessionRepo, _) = BuildUow();
        var sessionId = Guid.NewGuid();
        var existing = new ExamSession { Id = sessionId };

        sessionRepo.Setup(x => x.GetByIdAsync(sessionId)).ReturnsAsync(existing);

        var service = new ExamSessionService(uow.Object, CreateMapper());

        await service.RemoveAsync(sessionId);

        sessionRepo.Verify(x => x.RemoveAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
