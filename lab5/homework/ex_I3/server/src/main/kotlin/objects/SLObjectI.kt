package objects

import com.zeroc.Ice.Current
import com.zeroc.Ice.Util

class SLObjectI(private val id: Int): Servants.SLObject {
    private var loadsOfData: String = ""

    init {
        println("SLObjectI: Created servant with id $id")
    }

    override fun setState(loadsOfData: String, current: Current) {
        val obj = Util.identityToString(current.id)
        println("SLObjectI: setState called on object $obj (servant id $id)")
        this.loadsOfData = loadsOfData
    }

    override fun getState(current: Current): String {
        val obj = Util.identityToString(current.id)
        println("SLObjectI: getState called on object $obj (servant id $id)")
        return loadsOfData
    }
}
