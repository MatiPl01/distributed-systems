using Newtonsoft.Json;

namespace Agency;

public static class Utils
{
    private static JsonSerializerSettings? _serializerSettings = new JsonSerializerSettings
    {
        ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver()
    };

    public static string GetAgencyName(string[] args)
    {
        if (args.Length >= 1) return args[0];
        Console.WriteLine("Please provide an agency name");
        Environment.Exit(1);

        return args[0];
    }
    
    public static string SerializeJson(object obj)
    {
        return JsonConvert.SerializeObject(obj, _serializerSettings);
    }
}
