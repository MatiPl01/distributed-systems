import kotlinx.serialization.Serializable

@Serializable
data class ConfirmationResponse(
    val agencyName: String,
    val internalId: Int,
    val requestType: String,
    val carrierName: String
)
