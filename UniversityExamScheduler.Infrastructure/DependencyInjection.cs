using Microsoft.Extensions.DependencyInjection;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Infrastructure.Repositories;

namespace UniversityExamScheduler.Infrastructure;

public static class DependencyInjection
{
	public static IServiceCollection AddInfrastructure(this IServiceCollection services)
	{
        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IStudentGroupRepository, StudentGroupRepository>();
        services.AddScoped<IExamRepository, ExamRepository>();
        services.AddScoped<IExamSessionRepository, ExamSessionRepository>();
        services.AddScoped<IRoomRepository, RoomRepository>();
        services.AddScoped<IExamTermRepository, ExamTermRepository>();
        services.AddScoped<IExamTermHistoryRepository, ExamTermHistoryRepository>();

        // Unit of Work
		services.AddScoped<IUnitOfWork, UnitOfWork>();

		return services;
	}
}
