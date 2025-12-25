using Microsoft.Extensions.DependencyInjection;
using UniversityExamScheduler.Application.Services;
using FluentValidation;

namespace UniversityExamScheduler.Application;

public static class DependencyInjection
{
	public static IServiceCollection AddApplication(this IServiceCollection services)
	{
        // Services
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IStudentGroupService, StudentGroupService>();
        services.AddScoped<IRoomService, RoomService>();
        services.AddScoped<IExamService, ExamService>();
        services.AddScoped<IExamSessionService, ExamSessionService>();
        services.AddScoped<IExamTermService, ExamTermService>();
        services.AddScoped<IExamTermHistoryService, ExamTermHistoryService>();

        // AutoMapper
        services.AddAutoMapper(typeof(DependencyInjection).Assembly);

        // Fluent Validation
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

		return services;
	}
}
