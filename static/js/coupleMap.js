export default class coupleMap extends Map {
    
    // Map-like methods
    set(couple, value) {
        /**
         * Store virtually an entry of the form couple : value with couple
         * being an array of length 2 with integer entries
         *
         * Errors       : TypeError if couple's entries are not numbers
         *                  or couple's length is not 2 
         * 
         * @param  {Array}     couple   The new key
         * @param  {<Any>}     value    Associated value
         * @return {coupleMap}          The object itself for chainability
         */

        if (!_checkCouple(couple)) {
            throw TypeError(`Adding into coupleMap with bad key ${couple}`);
        }

        return super.set(couple.toString(), value);
    }

    get(couple) {
        /**
         * Retrieve the entry associated to the given couple.
         * 
         * Errors       : TypeError if couple is not a well-formed number array
         * 
         * @param  {Array}    couple    Key of the data we want to retrieve
         * @return {Any}                Retrieved value (undefined if not key)
         */

        if (!_checkCouple(couple)) {
            throw TypeError(`Getting form coupleMap with bad key ${couple}`);
        }

        return super.get(couple.toString());
    }

    has(couple) {
        /**
         * Return true if coupleMap has `couple` among its keys
         * 
         * Errors       : TypeError if couple is not a well-formed number array
         * 
         * @param {Array}     couple    The key we want to test membership of
         * @return {Boolean}
         */

        if (!_checkCouple(couple)) {
            throw TypeError(`Testing membership of malformed key ${couple}`);
        }

        return super.has(couple.toString());
    }

    delete(couple) {
        /**
         * Remove the key `couple` if well-formed and available in coupleMap
         * 
         * Errors       : TypeError if couple is not a well-formed number array
         * 
         * @param  {Array}    couple    The key we want to remove
         * @return {Boolean}            True if couple was a stored key.
         */

        if (!_checkCouple(couple)) {
            throw TypeError(`Removing from coupleMap with malformed key ${couple}`);
        }

        return super.delete(couple.toString());
    }

    // Other methods
    extend(iter) {
        /**
         * Given an iterable with item of the form [key, value] with key being
         * a vaild Number couple, this methods add abstractly entries of the
         * form `key: value`.
         * 
         * Errors       : TypeError if iter is not iterable
         *              : TypeError if iter contain an invalid number couple
         * 
         * @param  {iterable}  iter     The iterable of elements to add
         * @return {coupleMap}          Return this for method chainability
         */

        if (iter[Symbol.iterator] === undefined) {
            throw TypeError("passed non-iterable argument");
        }

        for ([key, value] of iter) {

            if (!_checkCouple(key)) {
                throw TypeError(`iterable contain invalid couple ${key}`);
            }

            super.set(key.toString(), value);
        }

    }

    copy() {
        /** 
         * Return an independent copy of this object, safe to write without
         * altering `this` internals.
         * 
         * This method should not raise errors
         * 
         * @return {coupleMap}      A copy of `this`
         */

        let out = new coupleMap;
        // this saves a little bit of time as we don't have to access Map
        // for each iteration in the loop below
        let setMap = Map.prototype.set;

        for (let [key, value] of super[Symbol.iterator]()) {
            setMap.call(out, key, value);
        }

        return out;
    }

    // Functional methods
    filter(f) {
        /**
         * As Array.prototype.filter: given a function with signature
         * 
         *      f(x: Number, y: Number, v: Any) -> Boolean
         * 
         * removes from the coupleMap object all those entries that evaluate
         * f to false.
         * 
         * @param  {Function}   f   The filter being used 
         * @return {coupleMap}      The object itself for chainability
         */

        for (let entry of super[Symbol.iterator]()) {
            let [key, v] = entry;
            // Note: testing it turned out that using .map here is slow:
            //       for this reason `Number` is applied directly twice
            //       in the function call
            //
            // Before it was:
            //           key.split(',').map((x) => Number(x));
            let [x, y] = key.split(',');
            if (!f(+x, +y, v)) {

                // Note: using this.delete(x, y) would work the same but with
                // a bit more overhead as we need to invoke a function and
                // parse `x`, `y` twice.
                super.delete(key);
            }
        }

        return this;
    }

    // Symbol method
    *[Symbol.iterator]() { 
        for (let entry of super[Symbol.iterator]()) {
            let [enc_key, value] = entry;
            let dec_key = enc_key.split(',').map((x) => Number(x));

            yield [dec_key, value];
        }
    }

    // Internal methods
    toString() {
        let out = "{";
        let first = true;
        for (let [[x, y], val] of this) {
            if (!first) {
                out+=', ';
            }
            else {
                first = false;
            }
            out += `(${x}, ${y}): ${val}`;
        }
        out += "}";
        return out;
    }
}

function _checkCouple(couple) {
    /**
     * Given a couple array, check that it is a numeric couple, ie. that
     *  - it is an Array
     *  - its length is 2
     *  - its entries have both number type
     * 
     * This function should not fail
     * 
     * @param  {Array}   couple     Array in input
     * @return {Boolean}            True if couple is valid
     */

    if (!Array.isArray(couple) || couple.length != 2) {
        return false;
    }

    // Return true if all entries in couple are numbers
    //  Note: this approach is easier to refactor should we decide to change
    //  the length of couples.
    return couple.reduce((a, x) => a && (typeof x == "number"), true);
}