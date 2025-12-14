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

        // AutoMapper
        services.AddAutoMapper(typeof(DependencyInjection).Assembly);

        // Fluent Validation
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

		return services;
	}
}
