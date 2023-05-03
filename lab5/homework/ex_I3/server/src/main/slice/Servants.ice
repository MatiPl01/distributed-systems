#ifndef SERVANTS_ICE
#define SERVANTS_ICE

module Servants {
    /**
     * @brief Object used as a servant in one-to-one connections stored in the ASM
     * @details Objects used with the ASM are usually used frequently and are
     *          stored in the ASM to improve performance. The ASM is used
     *          to store frequently used objects. This behaviour prevents
     *          the creation of new servants for each connection on every
     *          request and makes it possible to reuse the same servant
     *          multiple times for the same connection. Servants stores in ASM
     *          are usually used frequently and are rarely destroyed and have
     *          unique state for each connection.
     *          The usage of the ASM also  makes a lot of sense when dealing
     *          with singletons.
     */
    interface ASMObject {
        /**
         * @brief Increments the call count of the servant
         * @details This method is used to increment the call count of the
         *          servant. The call count is used to determine how many
         *          times the servant was used for the same connection.
         */
        void registerCall();

        /**
         * @brief Gets the call count of the servant
         * @details This method is used to get the call count of the servant.
         *          The call count is used to determine how many times the
         *          servant was used for the same connection.
         *
         * @return int call count of the servant
         */
        int getCallCount();
    };

    /**
     * @brief Object used as a default servant reused for multiple connections
     * @details Objects used as default servants cannot have unique state for
     *          each connection. They are used for multiple connections where
     *          objects belong to the same category. They aren't stored in the
     *          ASM because they can be used multiple times and there is no
     *          need to store the separate servants for each connection. This
     *          behaviour improves the scalability of the server and reduces
     *          the memory usage.
     */
    interface DSObject {
        /**
         * @brief Adds two integers
         * @details This method is used to add two integers. It is used to
         *          demonstrate the usage of the default servants as there
         *          is no need to store state for each connection and the
         *          result of the operation is always the same (that's why
         *          the idempotent keyword is used).
         *
         * @param a first integer
         * @param b second integer
         *
         * @return int sum of the two integers
         */
        idempotent int add(int a, int b);
    };

    /**
     * @brief Object used to create a servant by the servant locator
     * @details Objects used with the servant locator are usually rarely used
     *          and are created on demand if the servant locator does not find
     *          a servant in the ASM or in the ice run time.
     *          These objects are rarely used so there is no need to store them
     *          in the ASM. Even though objects aren't used frequently, they
     *          still need to be created for each connection because each of
     *          them can have different state. They aren't stored in the ASM
     *          to save memory and improve the scalability of the server.
     *          The usage of the servant locator makes the most sense when
     *          servants hold loads of data and are rarely used.
     */
    interface SLObject {
        /**
         * @brief Sets the state of the servant
         * @details This method is used to set the state of the servant.
         *
         * @param loadsOfData string data to be set (usually a lot of data)
         */
        void setState(string loadsOfData);

        /**
         * @brief Gets the state of the servant
         * @details This method is used to get the state of the servant.
         *
         * @return string state of the servant
         */
        string getState();
    };
};

#endif // SERVANTS_ICE
