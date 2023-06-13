namespace Agency;

public interface IAgencyRequest
{
    string AgencyName { get; }
    string Type { get; }
    int InternalId { get; }
}

public class AgencyRequest: IAgencyRequest
{
    private static int _internalId = 0;
    
    public string AgencyName { get; }
    public string Type => "agency_request";
    public int InternalId { get; }

    public AgencyRequest(string agencyName)
    {
        AgencyName = agencyName;
        InternalId = _internalId++; 
    }
}
