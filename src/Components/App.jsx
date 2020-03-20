import React from 'react';
import Game from './Game.jsx';

const ROWS = 7;
const COLUMNS = 14;
const DIMENSIONS = 3+"vw";

const App = () => (

    <div>
        <Game rows={ROWS} columns={COLUMNS} cellDimensions = {DIMENSIONS}/>    
    </div>
);

export default App;