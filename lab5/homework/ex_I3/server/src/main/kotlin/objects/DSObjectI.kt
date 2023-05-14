package objects

import com.zeroc.Ice.Current
import com.zeroc.Ice.Util

class DSObjectI(private val id: Int): Servants.DSObject {
    init {
        println("DSObjectI: Created servant with id $id")
    }

    override fun add(a: Int, b: Int, current: Current): Int {
        val obj = Util.identityToString(current.id)
        println("DSObjectI: add called on object $obj (servant id $id)")
        return a + b
    }
}
