/**
 * WARNING: this is just an experiment! Rather than patching this it might be
 * better to build it from the ground up again
 */

import tiaoqiState from "./tiaoqiState.js";

// constants
const CST = {
    pieceRadius: 8,
    tileRadius: 7,
    tileSelectedRadius: 8,
    tileSelectedSpeed: 120,

    pieceColor: {
        0: "#B32424",
        1: "#2424B3",
    },

    pieceShadowColor: {
        0: "#FF0000",
        1: "#0000FF",
    },

    tileColor: "#cfcfcf",
    tileDistance: 21,
}

class objPiece {
    constructor(ctx, x, y, tilex, tiley, player) {
        this.ctx = ctx // Context for the canvas environment.
        this.x = x;
        this.y = y;
        this.tilex = tilex;
        this.tiley = tiley;
        this.r = CST.pieceRadius;

        // Typecheck index
        player = Number(player)
        if (typeof player != "number") {
            throw TypeError("Created piece assigned to no player!");
        }
        this.player = player;
    }

    draw() {
        // main piece
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
        this.ctx.fillStyle = CST.pieceColor[this.player];
        this.ctx.fill();
        this.ctx.closePath();

        // shadow
        let sx = this.x + this.r/4;
        let sy = this.y - this.r/4;
        let sr = this.r/1.8;

        this.ctx.beginPath();
        this.ctx.arc(sx, sy, sr, 0, 2*Math.PI);
        this.ctx.fillStyle = CST.pieceShadowColor[this.player];
        this.ctx.fill();
        this.ctx.closePath();
    }

    move(path, tilex, tiley) {
        // For now we simply teleport to the last location
        [this.x, this.y] = path.at(-1);

        this.tilex = tilex;
        this.tiley = tiley;
    }
}


class objTile {
    constructor(ctx, x, y, tilex, tiley) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.tilex = tilex;
        this.tiley = tiley;
        this.r = CST.tileRadius;

        // Variables related to selection
        this.selected = false;
        //  radius of the selection animation
        this.sr = CST.tileSelectedRadius;
        //  number of frames to complete an animation
        this.ss = CST.tileSelectedSpeed;
        //  timer
        this.st = 0;                
    }

    draw() {
        let ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
        ctx.fillStyle = CST.tileColor;
        ctx.fill();
        ctx.closePath();

        if (this.selected) {
            // draw 6 semi-circles
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.arc(
                    this.x, this.y, this.sr,
                    (2*i)*Math.PI/6 + 2*Math.PI*this.st/this.ss,
                    (2*i + 1)*Math.PI/6 + 2*Math.PI*this.st/this.ss);
                ctx.stroke();
                ctx.closePath();
            }
        }

        // update animation timer anyway
        this.st = (this.st + 1)%this.ss;
    }
}



class tiaoqiGame {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;

        this.pieces = [];
        this.board = [];

        // pointer to the currently selected piece.
        this.select = null;

        // Initialize the game
        this.ts = new tiaoqiState;

        // Add two players
        this.ts.playerAdd(2);

        this._standardSetup();
    }

    _addTile(tilex, tiley) {
        let [x, y] = this._abstract_to_screen([tilex, tiley]);

        // Create the new tile
        this.board.push(new objTile(this.ctx, x, y, tilex, tiley));

        // Update the internal state
        this.ts.boardAdd(tilex, tiley);
    }

    _addPiece(tilex, tiley, player) {
        let [x, y] = this._abstract_to_screen([tilex, tiley]);

        // Create the new piece
        this.pieces.push(new objPiece(
            this.ctx, x, y, tilex, tiley, String(player)));

        // Update the internal abstract game
        this.ts.pieceAdd(tilex, tiley, String(player));
    }

    _standardSetup() {
        /**
         * Setup the board as in a standard 2 players game
         */

        // setup the board
        for (let i = -8; i < 9; i++) {
            for (let j = -8; j < 9; j++) {

                if ((i >= -4 && j >= -4 && i+j <= 4) || (i <= 4 && j <= 4 && i+j >= -4)) {

                    this._addTile(i, j);
                }
            }
        }

        // setup first player
        for (let i = -4; i < 0; i++) {
            for (let j = -4; i+j != -4; j++) {

                this._addPiece(i, j, 0);
            }
        }

        // setup second player
        for (let i = 4; i > 0; i--) {
            for (let j = 4; i+j != 4; j--) {

                this._addPiece(i, j, 1);
            }
        }
    }

    _abstract_to_screen(couple) {
        let cx = this.canvas.width/2;
        let cy = this.canvas.height/2;
        let d = CST.tileDistance;

        let [x, y] = couple;
        return [cx + d*(y - x)/2, cy - d*(y + x)*Math.pow(3, .5)/2];
    }

    click(x, y) {
        // distance function
        let d = (X, Y) => Math.pow(Math.pow(x-X, 2) + Math.pow(y-Y, 2), .5);

        // did  we clicked a piece?
        let clicked = null
        for (let p of this.pieces) {
            if (d(p.x, p.y) < p.r) {
                clicked = p;
                break;   
            }
        }

        if (clicked !== null && clicked.player === this.ts.player) {
            // Deselect everything just in case
            this._board_deselect_all();

            // If we had already selected this piece
            if (this.select == clicked) {
                // deselect this
                this.select = null;
            }
            else {
                this.select = clicked;

                // Ask to the GameState what tiles can be reached
                let tree = this.ts.paths(clicked.tilex, clicked.tiley);

                for (let tile of this.board) {
                    if (tile.tilex == clicked.tilex && tile.tiley == clicked.tiley) {
                        continue;
                    }   

                    if (tree.has([tile.tilex, tile.tiley])) {
                        tile.selected = true;
                    }
                }
            }

        }

        // did we clicked a tile (but not a piece)?
        // Note: only relevant if we selected a piece and we might want to move
        //       it
        if (clicked === null && this.select !== null) {

            for (let t of this.board) {
                if (d(t.x, t.y) < t.r) {
                    clicked = t;
                }
            }

            if (clicked !== null) {
                // move the selected piece and delesect
                this._board_deselect_all()

                // movevent in the internal state
                let path = this.ts.move(
                    this.select.tilex, this.select.tiley,
                    clicked.tilex, clicked.tiley);

                // convert path to screen coordinate
                path = path.map((couple) => this._abstract_to_screen(couple));

                // movement in the object representation
                this.select.move(path, clicked.tilex, clicked.tiley);

                this.select = null;
            }
        }
    }

    _board_deselect_all() {
        for (let tile of this.board) {
            tile.selected = false;
        }
    }

    draw() {
        // clear the screen
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // first draw tiles
        for (let tile of this.board) {
            tile.draw();
        }

        // next draw pieces
        for (let piece of this.pieces) {
            piece.draw();
        }
    }
}


// Toy main loop
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

window.gs = new tiaoqiGame(ctx, canvas);

setInterval(() => gs.draw(), 33);

// Event listeners
document.addEventListener("click", handleClick);

function handleClick(e) {
    window.gs.click(
        e.clientX - canvas.offsetLeft, 
        e.clientY - canvas.offsetTop);
}