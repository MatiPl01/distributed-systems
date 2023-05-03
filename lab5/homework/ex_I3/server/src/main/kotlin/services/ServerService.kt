package services

import com.zeroc.Ice.Util

class ServerService {
    fun serve(args: Array<String>) {
        println("Starting server...")

        try {
            // Create a communicator
            val communicator = Util.initialize(args)
            // Create an object adapter
            val adapter = communicator.createObjectAdapter("ServantsAdapter")

            // Create a single ASM servant
            val asmServant = objects.ASMObjectI(1)
            adapter.add(asmServant, Util.stringToIdentity("ASM"))

            // Create a default servant for the "DS" category
            val dsServant = objects.DSObjectI(1)
            adapter.addDefaultServant(dsServant, "DS")

            // Create a servant locator for the "SL" category
            val slService = ServantLocatorService()
            adapter.addServantLocator(slService, "SL")

            // Activate the adapter
            adapter.activate()
            println("Server started")
            // Wait for shutdown
            communicator.waitForShutdown()
        } catch (ex: Exception) {
            error("Server failed with error: " + ex.message)
        }
    }
}
