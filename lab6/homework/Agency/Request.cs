namespace Agency;

public interface IRequest
{
    string AgencyName { get; }
    string InternalId { get; }
}

public class Request: IRequest
{
    public string AgencyName { get; }
    public string InternalId { get; }

    public Request(string agencyName)
    {
        AgencyName = agencyName;
        InternalId = GenerateInternalId();
    }
    
    private static string GenerateInternalId()
    { 
        return Guid.NewGuid().ToString();     
    }
}
