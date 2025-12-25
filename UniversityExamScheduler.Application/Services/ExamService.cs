using System;
using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.Exam.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Services;

public interface IExamService
{
    Task<Exam?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Exam>> ListAsync(CancellationToken cancellationToken = default);
    Task<Exam> AddAsync(CreateExamDto examDto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateExamDto examDto, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
}

public class ExamService : IExamService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public ExamService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public Task<Exam?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _uow.Exams.GetByIdAsync(id);

    public Task<IEnumerable<Exam>> ListAsync(CancellationToken cancellationToken = default) =>
        _uow.Exams.ListAsync(cancellationToken);

    public async Task<Exam> AddAsync(CreateExamDto examDto, CancellationToken cancellationToken = default)
    {
        var exam = _mapper.Map<Exam>(examDto);
        if (exam.Id == Guid.Empty) exam.Id = Guid.NewGuid();

        await _uow.Exams.AddAsync(exam, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        return exam;
    }

    public async Task UpdateAsync(Guid id, UpdateExamDto examDto, CancellationToken cancellationToken = default)
    {
        var exam = await _uow.Exams.GetByIdAsync(id);
        if (exam is null)
            throw new EntityNotFoundException($"Exam with ID '{id}' not found.");

        _mapper.Map(examDto, exam);
        await _uow.Exams.UpdateAsync(exam, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await _uow.Exams.GetByIdAsync(id);
        if (exam is null)
            throw new EntityNotFoundException($"Exam with ID '{id}' not found.");

        await _uow.Exams.RemoveAsync(exam, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }
}
