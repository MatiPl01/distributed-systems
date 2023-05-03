package objects

import com.zeroc.Ice.Current
import com.zeroc.Ice.Util

class ASMObjectI(private val id: Int) : Servants.ASMObject {
    private var callCount = 0

    init {
        println("ASMObjectI: Created servant with id $id")
    }

    override fun registerCall(current: Current) {
        val obj = Util.identityToString(current.id)
        println("ASMObjectI: registerCall called on object $obj (servant id "
                +  "$id)")
        callCount++
    }

    override fun getCallCount(current: Current): Int {
        val obj = Util.identityToString(current.id)
        println("ASMObjectI: getCallCount called on object $obj (servant id "
                +  "$id)")
        return callCount
    }
}
