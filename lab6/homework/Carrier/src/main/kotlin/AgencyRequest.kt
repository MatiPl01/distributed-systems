import kotlinx.serialization.Serializable

@Serializable
data class AgencyRequest(
    val agencyName: String,
    val type: String,
    val internalId: Int
)
