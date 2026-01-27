using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Infrastructure.Persistence;
using UniversityExamScheduler.Infrastructure.Repositories;

namespace UniversityExamScheduler.Infrastructure.Tests.Repositories;

public class UserRepositoryTests
{
    [Fact]
    public async Task SearchAsync_FiltersAndOrdersResults()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var context = new ApplicationDbContext(options);
        context.Users.AddRange(
            new User
            {
                Id = Guid.NewGuid(),
                Email = "alice@example.com",
                FirstName = "Alice",
                LastName = "Anderson",
                Role = Role.Student
            },
            new User
            {
                Id = Guid.NewGuid(),
                Email = "bob@example.com",
                FirstName = "Bob",
                LastName = "Anderson",
                Role = Role.Student
            },
            new User
            {
                Id = Guid.NewGuid(),
                Email = "zoe@example.com",
                FirstName = "Zoe",
                LastName = "Zimmer",
                Role = Role.Student
            });
        await context.SaveChangesAsync();

        var repository = new UserRepository(context);

        var (items, total) = await repository.SearchAsync(
            "and",
            role: null,
            isActive: null,
            isStarosta: null,
            page: 0,
            pageSize: 0);

        total.Should().Be(2);
        items.Select(u => u.FirstName).Should().ContainInOrder("Alice", "Bob");
    }
}
