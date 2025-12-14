using System;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;

public class BaseRepository<T> : IBaseRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _set;

    public BaseRepository(ApplicationDbContext context)
    {
        _context = context  ;
        _set = _context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id) =>
        await _set.FindAsync(new object[]{id});

    public async Task<IEnumerable<T>> ListAsync(CancellationToken cancellationToken = default) =>
        await _set.ToListAsync(cancellationToken);

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default) =>
        await _set.AddAsync(entity, cancellationToken);

    public void Update(T entity) => _set.Update(entity);

    public void Remove(T entity) => _set.Remove(entity);

}
