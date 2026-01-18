using System;
using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.User.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Services;

public interface IUserService
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByIdWithGroupsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> ListAsync(CancellationToken cancellationToken = default);
    Task<(IEnumerable<User> Items, int TotalCount)> SearchAsync(string? query, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<User> AddAsync(CreateUserDto userDto, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateUserDto userDto, CancellationToken cancellationToken = default);
}

public class UserService : IUserService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public UserService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _uow.Users.GetByIdAsync(id);

    public Task<User?> GetByIdWithGroupsAsync(Guid id, CancellationToken cancellationToken = default) =>
        _uow.Users.GetByIdWithGroupsAsync(id, cancellationToken);

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        _uow.Users.GetByEmailAsync(email, cancellationToken);

    public Task<IEnumerable<User>> ListAsync(CancellationToken cancellationToken = default) =>
        _uow.Users.ListAsync(cancellationToken);

    public Task<(IEnumerable<User> Items, int TotalCount)> SearchAsync(string? query, int page, int pageSize, CancellationToken cancellationToken = default) =>
        _uow.Users.SearchAsync(query, page, pageSize, cancellationToken);

    public async Task<User> AddAsync(CreateUserDto userDto, CancellationToken cancellationToken = default)
    {
        var user = _mapper.Map<User>(userDto);
        if (user.Id == Guid.Empty) user.Id = Guid.NewGuid();

        var existing = await _uow.Users.GetByEmailAsync(user.Email, cancellationToken);
        if (existing is not null)
            throw new EntityAlreadyExistsException($"User with email '{user.Email}' already exists.");

        if (user.IsStarosta && user.Role != Role.Student)
            throw new BusinessRuleException("Only students can be marked as starosta.");

        await _uow.Users.AddAsync(user, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _uow.Users.GetByIdAsync(id); 
        if (user is null)
            throw new EntityNotFoundException($"User with ID '{id}' not found.");

        if (user.Role == Role.DeanOffice)
        {
            var deanCount = await _uow.Users.CountByRoleAsync(Role.DeanOffice, cancellationToken);
            if (deanCount <= 1)
                throw new BusinessRuleException("Cannot remove the last user with the DeanOffice role.");
        }
        
        await _uow.Users.RemoveAsync(user, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Guid id, UpdateUserDto userDto, CancellationToken cancellationToken = default)
    {
        var user = await _uow.Users.GetByIdAsync(id);
        if (user is null)
            throw new EntityNotFoundException($"User with ID '{id}' not found.");

        if (user.Role == Role.DeanOffice && userDto.Role != Role.DeanOffice)
        {
            var deanCount = await _uow.Users.CountByRoleAsync(Role.DeanOffice, cancellationToken);
            if (deanCount <= 1)
                throw new BusinessRuleException("Cannot remove the DeanOffice role from the last dean's office user.");
        }

        if (userDto.IsStarosta && userDto.Role != Role.Student)
            throw new BusinessRuleException("Only students can be marked as starosta.");

        _mapper.Map(userDto, user); 
        await _uow.Users.UpdateAsync(user, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }
}
