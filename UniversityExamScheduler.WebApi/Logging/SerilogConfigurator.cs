using Serilog;
using Serilog.Events;

namespace UniversityExamScheduler.WebApi.Logging;

public static class SerilogConfigurator
{
    public static void ConfigureSerilog(IConfiguration? configuration)
    {
        var cfg = new LoggerConfiguration()
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Information)
            .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
            .MinimumLevel.Override("Microsoft.AspNetCore.Server.Kestrel", LogEventLevel.Information)
            .Enrich.FromLogContext()
            .Enrich.WithEnvironmentName();

        if (configuration is not null)
        {
            cfg = cfg.ReadFrom.Configuration(configuration);
        }
        else
        {
            cfg = cfg
                .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}");
        }

        Log.Logger = cfg.CreateLogger();
    }
}
