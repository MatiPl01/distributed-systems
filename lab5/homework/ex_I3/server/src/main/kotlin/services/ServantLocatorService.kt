package services

import com.zeroc.Ice.Current
import com.zeroc.Ice.Object
import com.zeroc.Ice.ServantLocator
import com.zeroc.Ice.Util

class ServantLocatorService: ServantLocator {
    private var servantId: Int = 1

    init {
        println("ServantLocatorService: Created servant locator")
    }

    override fun locate(curr: Current): ServantLocator.LocateResult {
        val obj = Util.identityToString(curr.id)
        println("ServantLocatorService: locate called on object $obj")

        // Create a new servant for each invocation
        val slObject = objects.SLObjectI(servantId++)
        return ServantLocator.LocateResult(slObject, null)
    }

    override fun finished(curr: Current, servant: Object, cookie: Any?) {}

    override fun deactivate(category: String) {}
}
