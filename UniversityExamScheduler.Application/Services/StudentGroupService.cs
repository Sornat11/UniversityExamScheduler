using System;
using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Services;

public interface IStudentGroupService
{
    Task<StudentGroup?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StudentGroup?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<IEnumerable<StudentGroup>> ListAsync(CancellationToken cancellationToken = default);
    Task<bool> IsMemberAsync(Guid studentId, Guid groupId, CancellationToken cancellationToken = default);
    Task<StudentGroup> AddAsync(CreateStudentGroupDto groupDto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateStudentGroupDto groupDto, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
}

public class StudentGroupService : IStudentGroupService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public StudentGroupService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public Task<StudentGroup?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _uow.StudentGroups.GetByIdAsync(id);

    public Task<StudentGroup?> GetByNameAsync(string name, CancellationToken cancellationToken = default) =>
        _uow.StudentGroups.GetByNameAsync(name, cancellationToken);

    public Task<IEnumerable<StudentGroup>> ListAsync(CancellationToken cancellationToken = default) =>
        _uow.StudentGroups.ListAsync(cancellationToken);

    public Task<bool> IsMemberAsync(Guid studentId, Guid groupId, CancellationToken cancellationToken = default) =>
        _uow.StudentGroups.IsMemberAsync(studentId, groupId, cancellationToken);

    public async Task<StudentGroup> AddAsync(CreateStudentGroupDto groupDto, CancellationToken cancellationToken = default)
    {
        var group = _mapper.Map<StudentGroup>(groupDto);
        if (group.Id == Guid.Empty) group.Id = Guid.NewGuid();

        var existing = await _uow.StudentGroups.GetByNameAsync(group.Name, cancellationToken);
        if (existing is not null)
            throw new EntityAlreadyExistsException($"Student group '{group.Name}' already exists.");

        await _uow.StudentGroups.AddAsync(group, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        return group;
    }

    public async Task UpdateAsync(Guid id, UpdateStudentGroupDto groupDto, CancellationToken cancellationToken = default)
    {
        var group = await _uow.StudentGroups.GetByIdAsync(id);
        if (group is null)
            throw new EntityNotFoundException($"Student group with ID '{id}' not found.");

        _mapper.Map(groupDto, group);
        await _uow.StudentGroups.UpdateAsync(group, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var group = await _uow.StudentGroups.GetByIdAsync(id);
        if (group is null)
            throw new EntityNotFoundException($"Student group with ID '{id}' not found.");

        await _uow.StudentGroups.RemoveAsync(group, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }
}
