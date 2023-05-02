using Google.Protobuf.WellKnownTypes;
using Grpc.Core;

namespace server.Services;

public class AirPollutionNotifierService : AirPollutionNotifier.AirPollutionNotifierBase
{
    private readonly ILogger<AirPollutionNotifierService> _logger;

    private static readonly string[] Cities =
    {
        "Kraków",
        "Warszawa",
        "Wrocław",
        "Gdańsk",
        "Poznań",
        "Katowice",
        "Łódź",
        "Szczecin",
        "Lublin"
    };

    private static readonly int AirPollutionCheckInterval = 1000;

    public AirPollutionNotifierService(ILogger<AirPollutionNotifierService> logger)
    {
        _logger = logger;
    }

    public override async Task SubscribeOnSchedule(
        SubscribeOnScheduleRequest request,
        IServerStreamWriter<AirPollutionNotification> responseStream,
        ServerCallContext context
    )
    {
        _logger.LogInformation("SubscribeOnSchedule request received");
        
        // Validate cities
        var cities = request.Cities;
        if (!ValidateCities(cities, context)) return;
        
        // Validate interval
        var interval = request.Interval;
        if (!ValidateInterval(interval, context)) return;
        
        RegisterCancellationToken(context);
        
        while (!context.CancellationToken.IsCancellationRequested)
        {
            _logger.LogInformation("Checking air pollution measurements for cities: {Cities}", string.Join(", ", cities));
            var measurements = await GetCurrentAirPollutionMeasurements(cities);
            await responseStream.WriteAsync(CreateNotification(measurements));
            await Task.Delay(FromSeconds(request.Interval));
        }
    }

    public override async Task SubscribeOnCondition(
        SubscribeOnConditionRequest request, 
        IServerStreamWriter<AirPollutionNotification> responseStream,
        ServerCallContext context)
    {
        _logger.LogInformation("SubscribeOnCondition request received");
        
        // Validate cities
        var cities = request.Cities;
        if (!ValidateCities(cities, context)) return;
        
        // Validate condition
        var criteria = request.Criteria;
        if (!ValidatePollutionCriteria(criteria, context)) return;
        
        RegisterCancellationToken(context);
        
        while (!context.CancellationToken.IsCancellationRequested)
        {
            _logger.LogInformation("Checking air pollution measurements for cities: {Cities}", string.Join(", ", cities));
            var measurements = await GetCurrentAirPollutionMeasurements(cities);
            var filteredMeasurements = GetMeasurementsMatchingCriteria(measurements, criteria);
            if (filteredMeasurements.Any())
            {
                await responseStream.WriteAsync(CreateNotification(filteredMeasurements));
            }
            
            // Add some delay between checks
            await Task.Delay(FromSeconds(AirPollutionCheckInterval));
        }
    }

    private static bool ValidateCities(IEnumerable<string> cities, ServerCallContext context)
    {
        foreach (var city in cities)
        {
            if (Cities.Contains(city)) continue;
            context.Status = new Status(StatusCode.InvalidArgument, $"City {city} is not supported");
            return false;
        }

        return true;
    }
    
    private static bool ValidateInterval(int interval, ServerCallContext context)
    {
        if (interval > 0) return true;
        context.Status = new Status(StatusCode.InvalidArgument, $"Interval {interval} must be greater than 0");
        return false;
    }
    
    private static bool ValidatePollutionCriteria(AirPollutionCriteria criteria, ServerCallContext context)
    {
        var isValid = true;

        isValid &= ValidateCriteriaValue(criteria.MinPm25, "MinPm25", context, 0, 600);
        isValid &= ValidateCriteriaValue(criteria.MaxPm25, "MaxPm25", context, 0, 600);
        isValid &= ValidateCriteriaValue(criteria.MinPm10, "MinPm10", context, 0, 1200);
        isValid &= ValidateCriteriaValue(criteria.MaxPm10, "MaxPm10", context, 0, 1200);
        
        if (criteria is { HasMinPm25: true, HasMaxPm25: true } && criteria.MinPm25 > criteria.MaxPm25)
        {
            context.Status = new Status(StatusCode.InvalidArgument, $"MinPm25 {criteria.MinPm25} should be less than MaxPm25 {criteria.MaxPm25}");
            isValid = false;
        }
        
        if (criteria is { HasMinPm10: true, HasMaxPm10: true } && criteria.MinPm10 > criteria.MaxPm10)
        {
            context.Status = new Status(StatusCode.InvalidArgument, $"MinPm10 {criteria.MinPm10} should be less than MaxPm10 {criteria.MaxPm10}");
            isValid = false;
        }

        return isValid;
    }

    private static bool ValidateCriteriaValue(double? value, string fieldName, ServerCallContext context, double minValue, double maxValue)
    {
        if (!value.HasValue) return true;
        if (!(value.Value < minValue) && !(value.Value > maxValue)) return true;
        context.Status = new Status(StatusCode.InvalidArgument, $"{fieldName} {value} should be between {minValue} and {maxValue}");
        return false;

    }

    private void RegisterCancellationToken(ServerCallContext context)
    {
        context.CancellationToken.Register(() =>
        {
            _logger.LogInformation("Connection with {ContextPeer} was lost", context.Peer);
        });
    }

    private static AirPollutionMeasurement[] GetMeasurementsMatchingCriteria(
        IEnumerable<AirPollutionMeasurement> measurements, AirPollutionCriteria criteria)
    {
        return measurements.Where(measurement =>
        {
            var isPm25Valid = !criteria.HasMinPm25 || measurement.Pm25.Value >= criteria.MinPm25;
            isPm25Valid &= !criteria.HasMaxPm25 || measurement.Pm25.Value <= criteria.MaxPm25;
            
            var isPm10Valid = !criteria.HasMinPm10 || measurement.Pm10.Value >= criteria.MinPm10;
            isPm10Valid &= !criteria.HasMaxPm10 || measurement.Pm10.Value <= criteria.MaxPm10;

            return isPm25Valid && isPm10Valid;
        }).ToArray();
    }

    private static async Task<IEnumerable<AirPollutionMeasurement>> GetCurrentAirPollutionMeasurements(IEnumerable<string> cities)
    {
        return await Task.WhenAll(cities.Select(AirPollutionMeasurementService.GetAirPollutionMeasurement));
    }

    private static AirPollutionNotification CreateNotification(IEnumerable<AirPollutionMeasurement> measurements)
    {
        var notification = new AirPollutionNotification();
        notification.Measurements.AddRange(measurements);
        notification.Timestamp = Timestamp.FromDateTime(UtcNow);
        return notification;
    }
}
