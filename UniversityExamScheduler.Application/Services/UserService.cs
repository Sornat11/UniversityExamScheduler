using System;
using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Application.Dtos.User;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Services;

public interface IUserService
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> ListAsync(CancellationToken cancellationToken = default);
    Task<User> AddAsync(CreateUserDto userDto, CancellationToken cancellationToken = default);
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

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        _uow.Users.GetByEmailAsync(email, cancellationToken);

    public Task<IEnumerable<User>> ListAsync(CancellationToken cancellationToken = default) =>
        _uow.Users.ListAsync(cancellationToken);

    public async Task<User> AddAsync(CreateUserDto userDto, CancellationToken cancellationToken = default)
    {
        var user = _mapper.Map<User>(userDto);
        if (user.Id == Guid.Empty) user.Id = Guid.NewGuid();

        var existing = await _uow.Users.GetByEmailAsync(user.Email, cancellationToken);
        if (existing is not null)
            throw new EntityAlreadyExistsException($"User with email '{user.Email}' already exists.");

        await _uow.Users.AddAsync(user, cancellationToken);
        return user;
    }
}
