using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Application.Mapping;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Tests.Services;

public class ExamTermServiceTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        return config.CreateMapper();
    }

    private static (Mock<IUnitOfWork> Uow, Mock<IExamTermRepository> TermRepo, Mock<IExamSessionRepository> SessionRepo)
        BuildUow()
    {
        var uow = new Mock<IUnitOfWork>();
        var termRepo = new Mock<IExamTermRepository>();
        var sessionRepo = new Mock<IExamSessionRepository>();

        uow.SetupGet(x => x.ExamTerms).Returns(termRepo.Object);
        uow.SetupGet(x => x.ExamSessions).Returns(sessionRepo.Object);
        uow.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        return (uow, termRepo, sessionRepo);
    }

    private static CreateExamTermDto CreateValidDto(Guid sessionId, DateOnly date)
    {
        return new CreateExamTermDto
        {
            CourseId = Guid.NewGuid(),
            SessionId = sessionId,
            RoomId = Guid.NewGuid(),
            Date = date,
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(11, 0),
            Type = ExamTermType.FirstAttempt,
            Status = ExamTermStatus.ProposedByLecturer,
            CreatedBy = Guid.NewGuid(),
            RejectionReason = null
        };
    }

    private static UpdateExamTermDto CreateValidUpdateDto(Guid sessionId, DateOnly date)
    {
        return new UpdateExamTermDto
        {
            SessionId = sessionId,
            RoomId = Guid.NewGuid(),
            Date = date,
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(12, 0),
            Type = ExamTermType.Retake,
            Status = ExamTermStatus.Approved,
            RejectionReason = null
        };
    }

    [Fact]
    public async Task AddAsync_DateInPast_ThrowsArgumentException()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var sessionId = Guid.NewGuid();
        var (uow, _, sessionRepo) = BuildUow();

        sessionRepo
            .Setup(x => x.GetByIdAsync(sessionId))
            .ReturnsAsync(new ExamSession { StartDate = today, EndDate = today.AddDays(5) });

        var service = new ExamTermService(uow.Object, CreateMapper());
        var dto = CreateValidDto(sessionId, today.AddDays(-1));

        Func<Task> act = () => service.AddAsync(dto);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Exam term date cannot be in the past.");
    }

    [Fact]
    public async Task AddAsync_DateOutsideSessionRange_ThrowsArgumentException()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var sessionId = Guid.NewGuid();
        var (uow, _, sessionRepo) = BuildUow();

        sessionRepo
            .Setup(x => x.GetByIdAsync(sessionId))
            .ReturnsAsync(new ExamSession { StartDate = today.AddDays(3), EndDate = today.AddDays(10) });

        var service = new ExamTermService(uow.Object, CreateMapper());
        var dto = CreateValidDto(sessionId, today.AddDays(1));

        Func<Task> act = () => service.AddAsync(dto);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Exam term date must be within the exam session range.");
    }

    [Fact]
    public async Task AddAsync_StartTimeNotBeforeEnd_ThrowsArgumentException()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var sessionId = Guid.NewGuid();
        var (uow, _, sessionRepo) = BuildUow();

        sessionRepo
            .Setup(x => x.GetByIdAsync(sessionId))
            .ReturnsAsync(new ExamSession { StartDate = today, EndDate = today.AddDays(10) });

        var service = new ExamTermService(uow.Object, CreateMapper());
        var dto = CreateValidDto(sessionId, today.AddDays(1));
        dto.StartTime = new TimeOnly(12, 0);
        dto.EndTime = new TimeOnly(12, 0);

        Func<Task> act = () => service.AddAsync(dto);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Start time must be before end time.");
    }

    [Fact]
    public async Task AddAsync_WhenValid_AddsTermAndSaves()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var sessionId = Guid.NewGuid();
        var (uow, termRepo, sessionRepo) = BuildUow();

        sessionRepo
            .Setup(x => x.GetByIdAsync(sessionId))
            .ReturnsAsync(new ExamSession { StartDate = today, EndDate = today.AddDays(10) });

        var service = new ExamTermService(uow.Object, CreateMapper());
        var dto = CreateValidDto(sessionId, today.AddDays(1));

        var result = await service.AddAsync(dto);

        result.Id.Should().NotBe(Guid.Empty);
        result.Date.Should().Be(dto.Date);

        termRepo.Verify(x => x.AddAsync(It.Is<ExamTerm>(t => t.SessionId == sessionId && t.Date == dto.Date), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenSessionMissing_ThrowsEntityNotFoundException()
    {
        var sessionId = Guid.NewGuid();
        var termId = Guid.NewGuid();
        var (uow, _, sessionRepo) = BuildUow();
        var date = DateOnly.FromDateTime(DateTime.UtcNow.Date).AddDays(1);
        var dto = CreateValidUpdateDto(sessionId, date);

        sessionRepo.Setup(x => x.GetByIdAsync(sessionId)).ReturnsAsync((ExamSession?)null);

        var service = new ExamTermService(uow.Object, CreateMapper());

        Func<Task> act = () => service.UpdateAsync(termId, dto);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Exam session with ID '{sessionId}' not found.");
    }

    [Fact]
    public async Task UpdateAsync_WhenTermMissing_ThrowsEntityNotFoundException()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var sessionId = Guid.NewGuid();
        var termId = Guid.NewGuid();
        var (uow, termRepo, sessionRepo) = BuildUow();

        sessionRepo
            .Setup(x => x.GetByIdAsync(sessionId))
            .ReturnsAsync(new ExamSession { StartDate = today, EndDate = today.AddDays(10) });
        termRepo.Setup(x => x.GetByIdAsync(termId)).ReturnsAsync((ExamTerm?)null);

        var service = new ExamTermService(uow.Object, CreateMapper());
        var dto = CreateValidUpdateDto(sessionId, today.AddDays(1));

        Func<Task> act = () => service.UpdateAsync(termId, dto);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Exam term with ID '{termId}' not found.");
    }

    [Fact]
    public async Task UpdateAsync_WhenValid_UpdatesAndSaves()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var sessionId = Guid.NewGuid();
        var termId = Guid.NewGuid();
        var (uow, termRepo, sessionRepo) = BuildUow();

        sessionRepo
            .Setup(x => x.GetByIdAsync(sessionId))
            .ReturnsAsync(new ExamSession { StartDate = today, EndDate = today.AddDays(10) });

        termRepo.Setup(x => x.GetByIdAsync(termId))
            .ReturnsAsync(new ExamTerm
            {
                Id = termId,
                SessionId = sessionId,
                Date = today,
                StartTime = new TimeOnly(8, 0),
                EndTime = new TimeOnly(9, 0),
                Status = ExamTermStatus.Draft,
                Type = ExamTermType.FirstAttempt
            });

        var service = new ExamTermService(uow.Object, CreateMapper());
        var dto = CreateValidUpdateDto(sessionId, today.AddDays(1));

        await service.UpdateAsync(termId, dto);

        termRepo.Verify(x => x.UpdateAsync(It.Is<ExamTerm>(t =>
            t.Id == termId &&
            t.SessionId == sessionId &&
            t.Date == dto.Date &&
            t.StartTime == dto.StartTime &&
            t.EndTime == dto.EndTime &&
            t.Status == dto.Status &&
            t.Type == dto.Type &&
            t.RejectionReason == dto.RejectionReason), It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_WhenMissing_ThrowsEntityNotFoundException()
    {
        var termId = Guid.NewGuid();
        var (uow, termRepo, _) = BuildUow();

        termRepo.Setup(x => x.GetByIdAsync(termId)).ReturnsAsync((ExamTerm?)null);

        var service = new ExamTermService(uow.Object, CreateMapper());

        Func<Task> act = () => service.RemoveAsync(termId);

        await act.Should().ThrowAsync<EntityNotFoundException>()
            .WithMessage($"Exam term with ID '{termId}' not found.");
    }

    [Fact]
    public async Task RemoveAsync_WhenValid_RemovesAndSaves()
    {
        var termId = Guid.NewGuid();
        var (uow, termRepo, _) = BuildUow();
        var existing = new ExamTerm { Id = termId };

        termRepo.Setup(x => x.GetByIdAsync(termId)).ReturnsAsync(existing);

        var service = new ExamTermService(uow.Object, CreateMapper());

        await service.RemoveAsync(termId);

        termRepo.Verify(x => x.RemoveAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        uow.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
