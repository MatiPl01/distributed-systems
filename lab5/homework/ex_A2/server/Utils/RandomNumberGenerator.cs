namespace server.Utils;

public static class RandomNumberGenerator
{
    private static readonly Random Random = new Random();

    public static double GetRandomDouble(double minimum, double maximum, int decimalPlaces)
    {
        var range = maximum - minimum;
        var randomValue = Random.NextDouble() * range + minimum;
        return Math.Round(randomValue, decimalPlaces);
    }
    
    public static int GetRandomInt(int minimum, int maximum)
    {
        return Random.Next(minimum, maximum);
    }
}
