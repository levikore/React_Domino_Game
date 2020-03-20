import React, { Component } from "react";
import Board from "./Board.jsx";
import UserBank from "./UserBank.jsx";
import Statistics from "./Statistics.jsx";
import theme from "./theme.css";

const MAX_NUMBER_ON_SIDE = 6;
const PLAYER_BANK_START_SIZE = 6;
const UP = "up";
const DOWN = "down";
const LEFT = "left";
const RIGHT = "right";

class Game extends Component {
    constructor(props) {
        super(props);
        this.rows = this.props.rows;
        this.columns = this.props.columns;
        this.cellDimensions = this.props.cellDimensions;
        this.possibleMoves = this.initializePossibleMoves();
        this.restartGame = this.restartGame.bind(this);
        this.currentTime = {};
        this.currentAvgTime = {};
        this.currentPossibleMove = null;
        this.gameHistoryArray = [];
        this.historyIndex = 0;

        this.handleBackButton = this.handleBackButton.bind(this);
        this.handleNextButton = this.handleNextButton.bind(this);

        this.state = {
            selectedPiece: null,
            boardMatrix: Array(this.rows).fill().map(() => Array(this.columns).fill(null)),
            bank: [],
            playerBank: [],

            isWinner: false,
            isLoser: false,
            isGameOn: true,
            numOfTurns: 0,
            takeFromTheStock: 0,
            score: 0,
            avgTimeOn: false
        };
    }

    componentDidMount() {
        this.initializeBanks();
        this.saveCurrentGame();
    }

    getStartBankArray() {
        var startBankArray = [];
        var piece;

        for (var i = 0; i <= MAX_NUMBER_ON_SIDE; i++) {
            for (var j = 0; j <= MAX_NUMBER_ON_SIDE; j++) {
                piece = new PrerenderedPiece(i, j, false, false, true)
                if (!startBankArray.some(member => member.number1 == j && member.number2 == i)) {
                    startBankArray.push(piece);
                }
            }
        }

        shuffleArray(startBankArray);
        return startBankArray;
    }

    popRundomMembersFromBankArray(bankArray, numberOfMembers) {
        return bankArray.splice(0, numberOfMembers);
    }

    setBankStates(bankArray, playerBankArray) {
        this.setState({
            bank: bankArray,
            playerBank: playerBankArray
        })
    }

    initializeBanks() {//onMount
        var startBankArray = this.getStartBankArray();
        var startPlayerBankArray = this.popRundomMembersFromBankArray(startBankArray, PLAYER_BANK_START_SIZE);
        this.setBankStates(startBankArray, startPlayerBankArray);
    }

    initializePossibleMoves() {
        var possibleMoves = [];

        for (var i = 0; i <= MAX_NUMBER_ON_SIDE; i++) {
            possibleMoves.push(this.getStartMoveArray());
        }

        return possibleMoves;
    }

    getStartMoveArray() {
        var possibleMovesArray = [];
        possibleMovesArray.push(new PossibleMove(getMiddle(this.rows), getMiddle(this.columns), true));
        return possibleMovesArray;
    }

    handlePieceSelect(row, column) {
        const selectedPiece = this.state.playerBank[column];
        if (selectedPiece == this.state.selectedPiece) {
            this.deselectPiece();
        }
        else {
            var newBoardMatrix = this.getBoardMatrixWithPossibleMoves(selectedPiece)
            this.setState({
                selectedPiece: selectedPiece,
                boardMatrix: newBoardMatrix
            });
        }
    }

    getBoardMatrixWithPossibleMoves(selectedPiece) {
        var boardMatrixCopy = this.getBoardMatrixWithoutPossibleMoves();
        var currentPossibleMovesForPiece = this.getPosibleMovesforPiece(selectedPiece);

        for (var i = 0; i < currentPossibleMovesForPiece.length; i++) {
            var pieceToPut = selectedPiece.clone();
            var possibleMove = currentPossibleMovesForPiece[i];
            pieceToPut.isHorizontal = this.isDoublePiece(pieceToPut) ? !possibleMove.isHorizontal : possibleMove.isHorizontal;
            pieceToPut.isInverted = possibleMove.isInverted(pieceToPut);
            boardMatrixCopy[possibleMove.row][possibleMove.column] = pieceToPut;
        }

        return boardMatrixCopy;
    }

    getBoardMatrixWithoutPossibleMoves() {
        var boardMatrixCopy = this.state.boardMatrix.slice(0);
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {
                boardMatrixCopy[i][j] = (boardMatrixCopy[i][j] != null && boardMatrixCopy[i][j].isPossibleMove) ? null : boardMatrixCopy[i][j];
            }
        }

        return boardMatrixCopy;
    }

    getPosibleMovesforPiece(piece) {
        var movesArray1 = this.possibleMoves[piece.number1].slice(0);
        var movesArray2 = this.possibleMoves[piece.number2].slice(0);

        var possibleMoves = movesArray1.concat(movesArray2);

        return possibleMoves;
    }

    getBoardMatrixWithNewPiece(lastMoveRow, lastMoveColumn) {
        var boardCopy = this.state.boardMatrix.slice(0);
        if (boardCopy[lastMoveRow][lastMoveColumn] != null) {
            boardCopy[lastMoveRow][lastMoveColumn].isPossibleMove = false;
        }

        return boardCopy;
    }

    updatePossibleMoves(row, column) {
        this.removeLastMoveFromPossibleMoves(row, column);
        this.addNewPossibleMoves(row, column);
    }

    removeLastMoveFromPossibleMoves(row, column) {
        for (var i = 0; i < this.possibleMoves.length; i++) {
            var movesArray = this.possibleMoves[i];

            for (var j = 0; j < movesArray.length; j++) {
                if (movesArray[j].row == row && movesArray[j].column == column) {
                    movesArray.splice(j, 1);
                    break;
                }
            }
        }
    }

    addNewPossibleMoves(row, column) {
        const lastPiece = this.state.boardMatrix[row][column];

        const isLastPieceHorizontal = lastPiece.isHorizontal;
        const isLastPieceInverted = lastPiece.isInverted;

        if (this.isDoublePiece(lastPiece)) {
            this.addVerticalPossibleMoves(row, column, lastPiece.number1, lastPiece.number1);
            this.addHorizontalPossibleMoves(row, column, lastPiece.number1, lastPiece.number1);

        }
        else {
            if (isLastPieceHorizontal) {
                this.addHorizontalPossibleMoves(row, column,
                    isLastPieceInverted ? lastPiece.number1 : lastPiece.number2,
                    isLastPieceInverted ? lastPiece.number2 : lastPiece.number1);

            }
            else {
                this.addVerticalPossibleMoves(row, column,
                    isLastPieceInverted ? lastPiece.number2 : lastPiece.number1,
                    isLastPieceInverted ? lastPiece.number1 : lastPiece.number2);
            }
        }
    }

    isDoublePiece(piece) {
        return piece.number1 === piece.number2;
    }

    addVerticalPossibleMoves(row, column, number1, number2) {
        this.addNewPossibleMove(row - 1, column, number1, false, DOWN);
        this.addNewPossibleMove(row + 1, column, number2, false, UP);
    }

    addHorizontalPossibleMoves(row, column, number1, number2) {
        this.addNewPossibleMove(row, column - 1, number1, true, RIGHT);
        this.addNewPossibleMove(row, column + 1, number2, true, LEFT);
    }

    addNewPossibleMove(row, column, number, isHorizontal, facingDirection) {
        if (row < this.rows && row >= 0 && column >= 0 && column < this.columns && this.state.boardMatrix[row][column] === null) {
            this.possibleMoves[number].push(new PossibleMove(row, column, isHorizontal, number, facingDirection));
        }
    }

    getUpdatedPlayerBank() {
        const currentPiece = this.state.selectedPiece;
        var playerBankCopy = this.state.playerBank.splice(0);

        if (currentPiece != null) {
            for (var i = 0; i < playerBankCopy.length; i++) {
                if (playerBankCopy[i].number1 === currentPiece.number1 && playerBankCopy[i].number2 === currentPiece.number2) {
                    break;
                }
            }

            playerBankCopy.splice(i, 1);
        }

        return playerBankCopy;
    }

    deselectPiece() {
        var newBoardMatrix = this.getBoardMatrixWithoutPossibleMoves();
        this.setState({
            selectedPiece: null,
            boardMatrix: newBoardMatrix
        });
    }

    handleGameAfterMove() {
        this.saveCurrentGame();
        var numOfMoves = this.countAvailableMoves();
        if (this.state.playerBank.length !== 0 && numOfMoves === 0 && this.state.bank.length !== 0) {
            this.popPieceIntoPlayerBankUntilThereArePossibleMoves();
        }
        else {
            this.handleWinState();
        }
    }

    countAvailableMoves() {
        var movesCounter = 0;
        const playerBank = this.state.playerBank;

        for (var i = 0; i < playerBank.length; i++) {
            movesCounter += this.possibleMoves[playerBank[i].number1].length + this.possibleMoves[playerBank[i].number2].length;
        }

        return movesCounter;
    }

    updatePlayerStatistics() {
        var currentPiece = this.state.selectedPiece

        if (currentPiece != null) {

            var newScore = this.state.score + currentPiece.number1 + currentPiece.number2;

            var newTurnCount = this.state.numOfTurns + 1;

            this.setState({
                score: newScore,
                numOfTurns: newTurnCount,
                avgTimeOn: true
            }, () => { this.setState({ avgTimeOn: false }); }
            );
        }
    }

    popPieceIntoPlayerBankUntilThereArePossibleMoves() {
        var bankCopy = this.state.bank.slice(0);
        var playerBankCopy = this.state.playerBank.slice(0);

        var stockTake = this.state.takeFromTheStock + 1;
        var newNumOfTurns = this.state.numOfTurns + 1;

        const newPiece = bankCopy.pop().clone();
        playerBankCopy.push(newPiece);

        this.setState({
            bank: bankCopy,
            playerBank: playerBankCopy,

            takeFromTheStock: stockTake,
            numOfTurns: newNumOfTurns
        },
            () => { this.handleGameAfterMove(); }
        );
    }

    handleWinState() {
        this.historyIndex = this.gameHistoryArray.length - 1;

        if (this.state.playerBank.length === 0) {
            this.setState({
                isWinner: true,
                isGameOn: false
            });
        }
        else {
            var movesNumber = this.countAvailableMoves();
            if (this.state.bank.length === 0 && movesNumber === 0) {
                this.setState({
                    isLoser: true,
                    isGameOn: false
                });
            }
        }
    }

    handleCellClick(row, column) {
        if (this.state.boardMatrix[row][column] != null && this.state.boardMatrix[row][column].isPossibleMove) {

            this.updatePlayerStatistics();
            var newBoardMatrix = this.getBoardMatrixWithNewPiece(row, column);
            var newPlayerBank = this.getUpdatedPlayerBank();

            this.setState({
                boardMatrix: newBoardMatrix,
                playerBank: newPlayerBank
            },
                () => { this.handleGameAfterMove(); }
            );

            this.deselectPiece();
            this.updatePossibleMoves(row, column);
        }
    }

    saveCurrentGame() {
        let gameHistoryObject = {
            "boardMatrix": this.state.boardMatrix.map((member) => member.map((innerMember) => innerMember)),
            "bank": this.state.bank.map((member) => member),
            "playerBank": this.state.playerBank.map((member) => member),
            "gameTime": this.currentTime,
            "avgTime": this.currentAvgTime,
            "numOfTurns": this.state.numOfTurns,
            "takeFromTheStock": this.state.takeFromTheStock,
            "score": this.state.score,
            "possibleMoves": this.possibleMoves.map((member) => member.map((innerMember) => innerMember))
        }

        this.gameHistoryArray.push(gameHistoryObject);
    }

    restartGame() {
        this.initializeBanks();
        this.possibleMoves = this.initializePossibleMoves();
        this.initializeStatistics();
        this.gameHistoryArray = [];
        this.historyIndex = 0;
        this.setState({
            selectedPiece: null,
            boardMatrix: Array(this.rows).fill().map(() => Array(this.columns).fill(null)),
            isWinner: false,
            isLoser: false,
            isGameOn: true
        }, () => {
            this.currentTime = {};
            this.currentAvgTime = {};
            this.saveCurrentGame();
        }
        );
    }

    initializeStatistics() {
        this.setState({
            numOfTurns: 0,
            takeFromTheStock: 0,
            score: 0,
            avgTimeOn: false
        });
    }

    timeBlockGetter(currentTime, currentAvgTime) {
        this.currentTime = currentTime;
        this.currentAvgTime = currentAvgTime;
    }

    handleBackButton() {
        if (this.historyIndex - 1 >= 0) {
            var currentHistoryObject = this.gameHistoryArray[--this.historyIndex];
            this.showCurrentHistory(currentHistoryObject);
        }
    }

    handleNextButton() {
        if (this.historyIndex + 1 < this.gameHistoryArray.length) {
            var currentHistoryObject = this.gameHistoryArray[++this.historyIndex];
            this.showCurrentHistory(currentHistoryObject);
        }
    }

    showCurrentHistory(currentHistoryObject) {
        this.currentTime = currentHistoryObject.gameTime;
        this.currentAvgTime = currentHistoryObject.avgTime;
        this.currentPossibleMove = currentHistoryObject.possibleMoves.map((member) => member.map((innerMember) => innerMember));
        this.setState({
            boardMatrix: currentHistoryObject.boardMatrix.map((member) => member.map((innerMember) => innerMember)),
            bank: currentHistoryObject.bank.map((member) => member),
            playerBank: currentHistoryObject.playerBank.map((member) => member),
            numOfTurns: currentHistoryObject.numOfTurns,
            takeFromTheStock: currentHistoryObject.takeFromTheStock,
            score: currentHistoryObject.score,
        });
    }

    render() {
        let newGameButton = this.state.isGameOn ? null : <button onClick={this.restartGame}>New Game</button>;
        let backButton = this.state.isGameOn ? null : <button onClick={this.handleBackButton}>Prev</button>;
        let nextButton = this.state.isGameOn ? null : <button onClick={this.handleNextButton}>Next</button>;

        return (
            <div>
                <h1>React Domino</h1>
                <div id="gameContainer">
                    <Board
                        rows={this.rows}
                        columns={this.columns}
                        cellDimensions={this.cellDimensions}
                        boardMatrix={this.state.boardMatrix}
                        handleCellClick={(row, column) => this.handleCellClick(row, column)}
                    />
                    <div>
                        <Statistics
                            numOfTurns={this.state.numOfTurns}
                            takeFromTheStock={this.state.takeFromTheStock}
                            score={this.state.score}
                            avgTimeOn={this.state.avgTimeOn}
                            isGameOn={this.state.isGameOn}
                            currentTime={this.currentTime}
                            currentAvgTime={this.currentAvgTime}
                            timeBlockGetter={(currentTime, currentAvgTime) => this.timeBlockGetter(currentTime, currentAvgTime)}
                        />
                        {newGameButton}
                        {backButton}
                        {nextButton}
                    </div>
                </div>
                <div className={this.state.isGameOn ? "" : "guiAfterEndGame"}>
                    <UserBank
                        containedPieces={this.state.playerBank}
                        selectedPiece={this.state.selectedPiece}
                        piecesLeftInBank={this.state.bank.length}
                        cellDimensions={this.cellDimensions}
                        handleCellClick={(row, column) => this.handlePieceSelect(row, column)}
                    />
                </div>

                {this.state.isWinner ? "YOU WIN!!!" : ""}{this.state.isLoser ? "YOU LOSE );" : ""}

            </div>
        );
    }
}

function PossibleMove(row, column, isHorizontal, facingNumber, direction) {
    this.row = row,
        this.column = column,
        this.isHorizontal = isHorizontal,
        this.facingNumber = facingNumber,
        this.direction = direction,
        this.isInverted = function (piece) {
            var isInverted = false;
            if (typeof this.direction !== "undefined") {
                if (this.direction === UP || this.direction === RIGHT) {
                    if (piece.number1 != this.facingNumber) {
                        isInverted = true;
                    }
                }
                else if (this.direction === DOWN || this.direction === LEFT) {
                    if (piece.number2 != this.facingNumber) {
                        isInverted = true;
                    }
                }
            }

            return isInverted;
        }
}

function PrerenderedPiece(number1, number2, isHorizontal, isInverted, isPossibleMove) {
    this.number1 = number1,
        this.number2 = number2,
        this.isHorizontal = isHorizontal,
        this.isInverted = isInverted,
        this.isPossibleMove = isPossibleMove

    this.clone = function () {
        return new PrerenderedPiece(this.number1, this.number2, this.isHorizontal, this.isInverted, this.isPossibleMove);

    }
}

function getMiddle(number) {
    var middle = (number / 2).toFixed() - 1
    return middle >= 0 ? middle : middle - 1;
}

/**
 * Randomize array element order in-place.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export default Game;
