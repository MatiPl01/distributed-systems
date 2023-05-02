using Google.Protobuf.WellKnownTypes;
using server.Utils;

namespace server.Services;

public static class AirPollutionMeasurementService
{
    public static async Task<AirPollutionMeasurement> GetAirPollutionMeasurement(string city)
    {
        var measurement = new AirPollutionMeasurement
        {
            City = city
        };

        if (RandomNumberGenerator.GetRandomInt(0, 1) == 0)
        {
            // Add some delay to simulate real-world scenario
            await Task.Delay(RandomNumberGenerator.GetRandomInt(0, 100));
            measurement.Pm25 = GetPm25Measurement();
            // Add some delay to simulate real-world scenario
            await Task.Delay(RandomNumberGenerator.GetRandomInt(0, 100));
            measurement.Pm10 = GetPm10Measurement();
        }
        else
        {
            // Add some delay to simulate real-world scenario
            await Task.Delay(RandomNumberGenerator.GetRandomInt(0, 100));
            measurement.Pm10 = GetPm10Measurement();
            // Add some delay to simulate real-world scenario
            await Task.Delay(RandomNumberGenerator.GetRandomInt(0, 100));
            measurement.Pm25 = GetPm25Measurement();
        }

        return measurement;
    }
    
    private static Pm25Measurement GetPm25Measurement()
    {
        var value = GetRandomPm25Value();
        
        return new Pm25Measurement
        {
            Value = value,
            Level = GetPm25Level(value),
            Timestamp = Timestamp.FromDateTime(UtcNow)
        };
    }
    
    private static Pm10Measurement GetPm10Measurement()
    {
        var value = GetRandomPm10Value();
        
        return new Pm10Measurement
        {
            Value = value,
            Level = GetPm10Level(value),
            Timestamp = Timestamp.FromDateTime(UtcNow)
        };
    }
    
    private static double GetRandomPm25Value()
    {
        return RandomNumberGenerator.GetRandomDouble(0, 300, 2);
    }
    
    private static double GetRandomPm10Value()
    {
        return RandomNumberGenerator.GetRandomDouble(0, 500, 2);
    }
    
    private static AirPollutionLevel GetPm25Level(double value)
    {
        return value switch
        {
            < 0 => AirPollutionLevel.Unknown,
            <= 12 => AirPollutionLevel.Good,
            <= 35.4 => AirPollutionLevel.Moderate,
            <= 55.4 => AirPollutionLevel.UnhealthyForSensitiveGroups,
            <= 150.4 => AirPollutionLevel.Unhealthy,
            <= 250.4 => AirPollutionLevel.VeryUnhealthy,
            _ => AirPollutionLevel.Hazardous
        };
    }

    private static AirPollutionLevel GetPm10Level(double value)
    {
        return value switch
        {
            < 0 => AirPollutionLevel.Unknown,
            <= 54 => AirPollutionLevel.Good,
            <= 154 => AirPollutionLevel.Moderate,
            <= 254 => AirPollutionLevel.UnhealthyForSensitiveGroups,
            <= 354 => AirPollutionLevel.Unhealthy,
            <= 424 => AirPollutionLevel.VeryUnhealthy,
            _ => AirPollutionLevel.Hazardous
        };
    }
}
