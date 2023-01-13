import coupleSet from "./coupleSet.js";
import coupleMap from "./coupleMap.js";

//=============================================================================
// Extends the Error class
//  NOTE: this must be invoked with `new`... a bit annoying
/**
 * Error:
 *  |
 *  |-- TiaoqiInternalError:
 *  |   |
 *  |   |-- BoardError
 *  |   |-- PieceError
 *  |   |-- PlayerError
 *  |   |-- PathError
 */
class TiaoqiInternalError extends Error {};

class BoardError extends TiaoqiInternalError {
    constructor(...args) {
        super(...args);
        this.name = "BoardError";
    }
};

class PieceError extends TiaoqiInternalError {
    constructor(...args) {
        super(...args);
        this.name = "PieceError";
    }
};

class PlayerError extends TiaoqiInternalError {
    constructor(...args) {
        super(...args);
        this.name = "PlayerError";
    }
};

class PathError extends TiaoqiInternalError {
    constructor(...args) {
        super(...args);
        this.name = "PathError";
    }
};


//=============================================================================

export default class tiaoqiState {
    /* Class containing abstract informations on the current game
     *    
     * What is it:
     * Implements the basic game mechanics, path-finding, movement, and manages
     * player rounds (leaving however some controll over these things).
     *   
     * What it DOES assume:
     * This class assumes basic rules [and some variation] for tiaoqi applies.
     * Although some variations are provided, those are internal to the class
     * and no API to dynamically alter those is provided.
     *
     * What it DOES NOT assume:
     * This class is agnostic to board shape (which can be even dynamically
     * adjusted), number of pieces, number of players, existence of unjumpable
     * pieces
     */

    constructor() {
        
        /**   
         * A dictionary containing entries of the form (x, y) : type
         * type can be one of the following String values:
         * `u`        : unjumpable piece
         * `j`        : jumpable but non playing piece
         * `${num}`   : integer values, refer to P{num}
         */
        this._pieces = new coupleMap;

        /**
         * A set object containing couples, i.e. arrays of the form [x, y] with
         * numeric coordinates
         */
        this._board = new coupleSet;

        // number of currently registered players
        this._player_num = 0;

        // currently playing player. If there is no registered player is `null`
        this._player = null;

        // list of neighbouring points from (0, 0). Extended to any point by
        // homogeneity
        this._NEIGHBOURHOOD = [
            [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]
        ];
    }

    pieceAdd(x, y, kind) {
        /**
         * Add a new piece on the board at position (x, y).
         * 
         * Errors       : BoardError if (x, y) is not on board
         *              : PieceError if (x, y) is occupied
         *              : TypeError if king is not a string
         *              : PieceError if `kind` is malformed
         *                  this is considered a piece error since that piece
         *                  kind is possibly not yet supported.
         *              : PlayerError if p[i] does not exists
         * 
         * @param  {number} x       First board coordinate
         * @param  {number} y       Second board coordate
         * @param  {string} kind    A string of the following type
         *              : `0`, `1`, ...     player piece
         *              : "j"               jumpable piece
         *              : "u"               unjumpable piece
         */

        // Board tile present
        if (!this._board.has([x, y])) {
            throw new BoardError(`Adding piece in position (${x}, ${y}) out of board`);
        }

        // Board tile is free
        if (this._pieces.has([x, y])) {
            throw new PieceError(`Adding piece in position (${x}, ${y}) already occupied`);
        }

        // Typecheck kind
        if (typeof kind != "string") {
            throw new TypeError(`Adding piece of non-string type kind: ${kind}`);
        }

        // Kind is well formed and it is a playing player
        if (kind !== "u" && kind !== "j") {

            // pid: player id (since kind at this point can only be a number)
            let pid = Number(kind)
            
            // Note: if kind is not a digit sequence, Number.isInteger()
            // returns false.
            if (String(pid) !== kind || !Number.isInteger(pid)) {
                throw new PieceError(`Adding piece of unknown kind ${kind}`);
            }

            if (0 > pid || pid >= this._player_num) {
                throw new PlayerError(`Adding piece for undefined player ${pid}`);
            }
        }

        // If all else pass, add it safely
        this._pieces.set([x, y], kind);
    }

    pieceRemove(x, y) {
        /**
         * Remove the object currently stored at position (x, y). No error is
         * thrown if no piece is at position (x, y).
         * 
         * Error        : TypeError if x, y are not number-type
         *
         * @param  {number} x       Removed piece position first coordinate
         * @param  {number} y       Removed piece position second coordinate
         */

        this._pieces.delete([x, y]);
    }

    pieceRemoveAll(f=null) {
        /**
         * Remove all objects for which f returns true. If no function is
         * specified all objects are removed.
         * 
         * f(x, y, kind) -> boolean     : `x`, `y` are the piece coordinate
         *                                `kind` is the object kind
         * 
         * Errors       : TypeError if f is not a function or null
         * 
         * @param {function|null} f      optional filter function
         */

        if (f === null) {
            // I would love to simply do `new coupleMap;` but I'm trying to use
            // `coupleMap` explicitly only once and elsewhere I only rely on
            // the (functional) Map API.
            this._pieces.clear();
        }

        if (typeof f !== "function") {
            throw TypeError("filter is not a function!");
        }

        this._pieces.filter((x, y, k) => !f(x, y, k));
    }

    boardAdd(x, y) {
        /**
         * Add position x, y on the board. If (x, y) was already on board 
         * nothing happens.
         * 
         * Errors      : TypeError if x, y are not number values
         * 
         * @param {number} x        New position first coordinate
         * @param {number} y        New position second coordinate
         */

        // Note: the error will be thrown by `coupleSet`.
        this._board.add([x, y]);
    }

    boardAddIter(iter) {
        /**
         * Add the couples in `iterator` to the board. Those tiles that were 
         * already on the board are not added again.
         * 
         * Errors       : TypeError if `iter` objects are not couples of
         *                  numbers
         *              : TypeError if `iter` is not iterable           
         * 
         * @param {iterator} iter   Iterator of number couples
         */

        if (iter[Symbol.iterator] === undefined) {
            throw TypeError("passed non-iterable argument");
        }

        // the validity of number couples is done inside the `coupleSet` class
        this._board.extend(iter);
    }

    boardRemove(x, y) {
        /**
         * Remove the board place at position x, y. No error is raised if
         * (x, y) was not on board.
         *
         * Errors      : PieceError if (x, y) contains a piece. Consider
         *                  removing it first with `.pieceRemove`
         * 
         * @param {number} x        Removed tile's first coordinate
         * @param {number} y        Removed tile's second coordinate
         */

        if (this._pieces.has([x, y])) {
            throw new PieceError(`removing occupied tile (${x}, ${y})`);
        }

        this._board.delete([x, y]);
    } 

    boardRemoveAll(f=null) {
        /** 
         * Remove all pieces of board for which f returns true. If no
         * function is specified all objects are removed.
         * 
         * f(x, y) -> bool      : `x`, `y` are the tile coordinates
         * 
         * Errors       : PieceError if a removed position contains a piece.
         *                  consider removing pieces first with the same filter
         *                  f and method `.pieceRemoveAll`
         *              : TypeError if f is not a function or null
         * 
         * @param {function|null} f     optional filter to remove elements
         */

        if (f === null) {
            this._board.clear();
        }

        if (typeof f !== "function") {
            throw TypeError("filter is not a function");
        }

        this._board.filter((x, y) => !f(x, y));
    }

    playerAdd(num=1) {
        /**
         * Add `num` player with no pieces. If not given num default to 1.
         * If not player was present, the player 0 becomes the currently
         * playing one.
         * 
         * Errors       : TypeError if num is not int
         *              : PlayerError if num < 1
         * 
         * @param {number} num      Number of played added
         */

        if (typeof num != "number" || !Number.isInteger(num)) {
            throw TypeError("Adding non-integer number of players");
        }

        if (num < 1) {
            throw TypeError("Adding non-positive number of players");
        }

        this._player_num += num;

        if (this._player === null) {
            this._player = 0;
        }
    }

    playerPop(num=1) {
        /**
         * Remove the last player if no argument is given, or `num` players
         * otherwise.
         * 
         * If the removed players was also the current player, the current
         * player becomes player 0. When player 0 is removed, current player
         * is `null`.
         * 
         * Nothing happens if there is no player to pop, ie. num < 1. 
         * 
         * If we request to pop more player than possible no error is thrown.
         * 
         * Errors       : TypeError if num is not int
         *              : PieceError if the pop-ed player still has pieces on
         *                  the board. To remove all pieces of a player call
         *                  `.pieceRemoveAll(f)` with f being true for all
         *                  pieces of kind p{i}.
         * 
         * @param {number} num      Number of removed players
         */

        if (typeof num != "number" || !Number.isInteger(num)) {
            throw TypeError("Removing non-integer number of players");
        }

        if (num < 1) {
            throw TypeError("Removing non-positive number of players");
        }

        // Check that no piece on the board belong to the removed users
        for (kind of this._pieces.values()) {
            if (+kind >= this._player_num - num) {
                throw new PlayerError("Removing player with pieces still on board");
            }
        }

        this._player_num = Math.max(0, this._player_num - num);

        if (this._player !== null && this._player >= this._player_num) {
            if (this._player_num === 0) {
                this._player = null;
            }
            else {
                this._player = 0;
            }
        }
    }

    playerNext() {
        /**
         * Pass the turn from the current playing player to the next one.
         * 
         * This is mainly used internally at the end of each legal move, but in
         * variations where players are allowed to skip their turn, this 
         * should be the method of choice (as opposed to directly modifing the
         * public ".player")
         * 
         * Errors       : PlayerError if no player is currently playing
         */

        if (this._player_num === 0) {
            throw new PlayerError("Next player is undefined since no player is currently playing");
        }

        this._player = (this._player + 1)%this._player_num;
    }

    paths(x, y) {
        /**
         * Return a Map of positions that a piece in (x, y) can reach
         * structured as a tree, i.e. if p2 is the father of p1 then
         * 
         *      tree[p1] = p2
         * 
         * The elements of distance one from the starting position points to
         * null.
         *
         * Note: (x, y) does not need to be a currently placed piece (although
         * the relevance of using this method for empty positions is unclear).
         * 
         * Note: If a Set of reacheable position is required one can create a
         * set of reachable positions from Set(map.keys()).
         * 
         * Errors       : BoardError if (x, y) is not on board
         * 
         * @param  {number} x        Starting position first coordinate
         * @param  {number} y        Starting position second coordinate
         * @return {Map}             Path tree
         */

        if (!this._board.has([x, y])) {
            throw new BoardError(`Computing paths from out-of-board tile (${x}, ${y})`);
        }

        // BST
        let tree = new coupleMap;
        tree.set([x, y], null);

        // TODO: at the moment we use an array to implement a Queue, which is
        // inefficient. If this becaomes too slow, implement a Queue
        let frontier = [[x, y]];

        while (frontier.length !== 0) {

            // Take the first 
            let [x_tmp, y_tmp] = frontier.shift();

            for (let [dx, dy] of this._NEIGHBOURHOOD) {

                // goal: tile we would like to jump to
                // jump: tile we would like to jump over
                let jump = [x_tmp + dx, y_tmp + dy];
                let goal = [x_tmp + 2*dx, y_tmp + 2*dy];

                
                // CASE 0: goal was already visited
                if (tree.has(goal)) {
                    continue;
                }

                // CASE 1: jump is not a piece or unjumpable
                let jump_piece = this._pieces.get(jump);
                if (jump_piece === undefined || jump_piece === "u") {
                    continue;
                }

                // CASE 2: goal is out-of-board or occupied
                if (!this._board.has(goal) || this._pieces.has(goal)) {
                    continue;
                }

                // If all test passed, `jump` is a jump piece (thus the tile is
                // on board) and goal is a free tile on board we have not
                // visited yet.
                //
                // So we add the link `goal` <- [x_tmp, y_tmp]

                tree.set(goal, [x_tmp, y_tmp]);
                frontier.push(goal);
            }
        }

        // Single jump search
        for (let [dx, dy] of this._NEIGHBOURHOOD) {

            let goal = [x + dx, y + dy];

            if (!this._board.has(goal) || this._pieces.has(goal)) {
                continue;
            }

            /* Note, we don't need to check that this place was reached before
             * (it can be shown that cells one can chain-jump into have a 
             * different invariant than the neighbouring cells)
             * 
             * Notice2: this holds for all tologies in which the symmetric
             * closure of the neighbour (N union -N for (0,0)) do not admits
             * a set of four or more points aligned containing the center.
             * 
             * We can then add this to the tree
             */

            tree.set(goal, [x, y]);
        }

        return tree;
    }

    move(x1, y1, x2, y2) {
        /**
         * Move a piece in position (x1, y1) to position (x2, y2). Returns a
         * shortest path from (x1, y1) to (x2, y2) including both points.
         * (x1, y1) has to be a piece of the current player. The next player
         * then becomes the new `current player`.
         * 
         * NOTE: currently the retuned type is a list, but the API only ensure
         * an iterator. Code depdending on this might be broken in future
         * versions.
         * 
         * Errors       : PieceError if (x1, y1) is not a piece, use addPiece
         * |                instead.
         * |            : PlayerError if (x1, y1) is not a current player piece
         * |                use `moveForce` instead.
         * |            : ___ if there is no path from (x1, y1) to (x2, y2):
         * |                | BoardError if the end is not on board.
         * |                | PieceError if the end is occupied.
         * |                | PathError otherwise.
         * |            : PathError if start and end point coincides. If you
         * |                wish to skip a round use `.platerNext`.
         * 
         * @param {number} x1       Starting position first coordinate
         * @param {number} y1       Starting position second coordinate
         * @param {number} x2       End position first coordinate
         * @param {number} y2       End position second coordinate
         * @return {iterator}       Iterator of paths coordinates
         */

        // Check (x1, y1) is a piece
        if (!this._pieces.has([x1, y1])) {
            throw new PieceError(`No piece to move from (${x1}, ${y1})`);
        }

        // Check (x1, y1) has a current player piece
        if (this._pieces.get([x1, y1]) !== this._player.toString()) {
            throw new PlayerError(`Moving a piece not belonging to current player from position (${x1}, ${y1})`);
        }

        // Check end points do not coincide
        if (x1 === x2 && y1 === y2) {
            throw new PathError("Movement endpoints cannot coincide");
        }

        // Get paths
        let tree = this.paths(x1, y1)

        // Check if there is a path from (x1, y1) --> (x2, y2)
        if (!tree.has([x2, y2])) {

            // If the end position is out of board, return a board error
            if (!this._board.has([x2, y2])) {
                throw new BoardError(`Moving to out-of-board location (${x2}, ${y2}`);
            }

            // If the end position is occupied, return a piece error
            if (this._pieces.has([x2, y2])) {
                throw new PieceError(`Moving to an already occupied tile (${x2}, ${y2})`);
            }

            // Otherwise just throw a path error
            throw new PathError(`No path from (${x1}, ${y1}) to (${x2}, ${y2})`);
        }

        // Perform the movement. We can do that safely because:
        // 1. We know there exists a valid path from the two locations
        // 2. The start positions contain a current player piece
        this._pieces.set([x2, y2], this._pieces.get([x1, y1]));
        this._pieces.delete([x1, y1]);

        // update the current player
        this.playerNext();

        // Build the path we need to return
        let tile = [x2, y2];
        let path = [];

        while (tile !== null) {
            path.push(tile);
            tile = tree.get(tile);
        }

        // reverse to have the array going from (x1, y1) to (x2, y2)
        path.reverse();

        return path;
    }

    moveForce(x1, y1, x2, y2) {
        /**
         * Move a piece from position (x1, y1) to position (x2, y2). Its
         * behaviour is similar to `remove(x1, y1)`, `add(x2, y2, <kind>)` with
         * the exception that no knowledge of `kind` is required, and that
         * there has to be a piece in (x1, y1)
         * 
         * Errors       : ValueError if (x1, y1) is not a piece
         *              : ValueError if (x2, y2) is a piece or not on board
         * 
         * Misusage     : ___ start and end point coincides, does nothing.
         * 
         * @param {number} x1       Starting position first coordinate
         * @param {number} y1       Starting position second coordinate
         * @param {number} x2       End position first coordinate
         * @param {number} y2       End position second coordinate
         */

        throw Error("unimplemented!");
    }

    get pieces() {
        /**
         * Return a Map-like object of pieces of the form (x, y) : kind
         * 
         * Implementation Note: DO NOT return internals as they are passed by
         * reference. Even if the output has the same structure, a deep copy
         * should be made first
         * 
         * @return {Map-like}       Map of pieces currently on the board
         */

        return this._pieces.copy();
    }

    get board() {
        /**
         * Return a Set-like object listing the tiles currently on the board
         * 
         * Implementation Note: DO NOT return internals as they are passed by
         * reference. Even if the output has the same structure, a deep copy
         * should be made first
         * 
         * @return {Set-like}       Set of tiles on board
         */

        return this._board.copy();
    }

    get player_num() {
        /**
         * Return the number of player currently playing
         * 
         * @return {Number}         Number of playing users
         */

        return this._player_num;
    }

    get player() {
        /**
         * return the current player's index or null if not player is currently
         * playing
         * 
         * @return {Number|null}    Index of current playing user or null
         */

        return this._player;
    }

    set player(index) {
        /**
         * Set the current playing user to `index`.
         * 
         * Errors       : TypeError if index is not an INTEGER
         *              : PlayerError if there is no registered player yet
         *              : PlayerError if index is not a registered player
         * 
         * @param {number} index    Index of player to set as playing this turn
         */

        if (typeof index !== "number" || !Number.isInteger(index)) {
            throw TypeError("Setting current player to non-integer value");
        }

        if (0 > index || index >= this._player_num) {
            // choose the right error to throw
            if (this._player_num == 0) {
                throw new PlayerError(`cannot set current player to ${index} as no player was added yet`);
            }
            else {
                throw new PlayerError(`Setting current player to unregistered player ${index}`);
            }
        }

        // If the checks don't fail, update player index.
        this._player = index;
    }

    // Internal methods
    toString() {
        let out = `board: ${this._board}\npieces: ${this._pieces}\n`
        out += `players: ${this._player_num}\ncurrent player: ${this._player}`

        return out;
    }
}




