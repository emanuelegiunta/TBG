/**
 * Notes:
 * 
 * The method `toArray` was eventually not implemented since we alreay have 
 * iteration so it's easier to just call `Array.from(instance)` with `instance`
 * being a `coupleSet` instance.
 * 
 */

export default class coupleSet extends Set {

    // Set-like methods 
    add(couple) {
        /**
         * Abstractly add the couple = [x, y] to the set.
         * 
         * Errors   : TypeError `couple` is not a number couple
         * 
         * @param  {number}  x  First couple entry
         * @param  {number}  y  Second couple entry
         * @return {object}     Self
         */

        if (!_checkCouple(couple)) {
            throw TypeError(`Adding malformed couple ${couple}`);
        }

        return super.add(couple.toString());
    }

    delete(couple) {
        /**
         * Abstractly remove the couple from the set.
         * 
         * Errors   : TypeError if `couple` is not a number couple
         * 
         * @param  {number}     x   First couple entry
         * @param  {number}     y   Second couple
         * @return {boolean}        True if the element was in the set
         */

        if (!_checkCouple(couple)) {
            throw TypeError(`Removing malformed couple ${couple}`);
        }

        return super.delete(couple.toString());
    }

    has(couple) {
        /**
         * Abstractly check if (x, y) is in the set
         * 
         * Error    : TypeError if couple is not a number couple
         *
         * @param  {number}  x  First couple entry
         * @param  {number}  y  Second couple entry
         * @return {boolean} 
         */

        // Note: we are not perform type-check here since we assume that wrong
        // types are mapped to object that do not belong to the set.

        if (!_checkCouple(couple)){
            throw TypeError(`Testing membership of bad couple ${couple}`);
        }

        return super.has(couple.toString());
    }

    // Other methods
    extend(iter) {
        /**
         * Given an iterator `iter` with objects of the form [x, y] with x, y
         * Numbers, it adds all these entries into the set.
         * 
         * Errors   : TypeError if iter is not iterable.
         *          : TypeError if iter has any invalid number couple
         *
         * @param  {iterator}  iter     The iterator from which add couples 
         * @return {coupleSet}          Return this for method chainability
         */

        // typecheck iter
        if (iter[Symbol.iterator] === undefined) {
            throw TypeError ("expected iterator object.");
        }

        for (let entry of iter) {
            // typecheck
            if (!_checkCouple(entry)) {
                throw TypeError(`inserting malformed couple ${entry}`);
            }

            // We call directly the parent method to speed up a little bit
            super.add(entry.toString());
        }

        return this;
    }

    union(other) {
        /**
         * Given another coupleSet S, add all its elements to `this`.
         * 
         * Note: this method is equivalent to `.extend(S)` but faster and
         * should be the method of choice.
         * 
         * Errors   : TypeError if S is not a coupleSet
         * 
         * @param {coupleSet}   S   Set in the union
         * @return {coupleSet}      Union of S1 and S2 (reference to this)
         */

        if (!other instanceof coupleSet) {
            throw TypeError(`performing union with non-coupleSet ${S}`);
        }

        // We borrow Set's iterator to access other's `super` iteration methods
        //  ie. the one that yields encoded tuples (so it's faster)
        for (let x of Set.prototype[Symbol.iterator].call(other)) {
            // NOTE: we do not type-check because S is a coupleSet, inductively
            // its entries are well formatted
            super.add(x)
        }

        return this;
    }

    copy() {
        /**
         * Return a copy of the internal state of `this` in a different
         * object safe to write without modifying `this`.
         * 
         * This method should not raise errors
         * 
         * @return {coupleSet}
         */

        let out = new coupleSet;
        // this saves a little bit of time as we don't have to access Map
        // for each iteration in the loop below
        let addSet = Set.prototype.add;

        for (let entry of super[Symbol.iterator]()) {
            addSet.call(out, entry);
        }

        return out;
    }

    // Functional methods
    filter(f) {
        /**
         * Given a function f with signature
         * 
         *      f(x: Number, y: Number) -> Boolean
         * 
         * remove from the set all the elements that evaluates the function to
         * True.
         * 
         * @param  {function}   f       Filter function
         * @return {coupleSet}          this object for chaining
         */

        for (let entry of super[Symbol.iterator]()) {
            let [x, y] = entry.split(',');
            if (!f(+x, +y)) {

                super.delete(entry);
            }
        }
    }

    // Symbol methods
    *[Symbol.iterator]() {
        for (let encoded_entry of super[Symbol.iterator]()) {
            let decoded_entry = encoded_entry.split(',').map((x) => Number(x));
            yield decoded_entry;
        }
    }

    // Internal methods
    toString() {
        let out = "{";
        let first = true;
        for (let [x, y] of this) {
            if (!first) {
                out+=', ';
            }
            else {
                first = false;
            }
            out += `(${x}, ${y})`;
        }
        out += "}";
        return out;
    }
}

// Helper functions (not public)
function _checkCouple(couple) {
    /**
     * Checks that `couple` is a well formed number couple, i.e.
     *  - it is an Array
     *  - it has length 2
     *  - it contains two numbers
     * 
     * This method should never fail
     * 
     * @param  {number}     x   First couple entry
     * @param  {number}     y   Second couple entry
     * @return {Boolean}        True if (x, y) is valid
     */

    if (!Array.isArray(couple)) {
        return false
    }

    if (couple.length != 2) {
        return false 
    }

    let [x, y] = couple;

    if (typeof x != "number" || typeof y != "number") {
        return false
    }

    return true
}