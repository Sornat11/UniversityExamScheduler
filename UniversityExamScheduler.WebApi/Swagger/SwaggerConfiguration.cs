using Microsoft.OpenApi;

namespace UniversityExamScheduler.WebApi.Swagger;

public static class SwaggerConfiguration
{
    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "UniversityExamScheduler API", Version = "v1" });
        });
        return services;
    }

    public static IApplicationBuilder UseSwaggerDocumentation(this IApplicationBuilder app)
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "UniversityExamScheduler API v1");
            c.RoutePrefix = string.Empty;
        });
        return app;
    }
}
