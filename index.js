const express  = require('express');
const app = express();
const csv = require('csv-parser');
const fs = require('fs');

app.use(express.json());
//Buffer    
let players = [];

//Load CSV Data
fs.createReadStream('players.csv')
  .pipe(csv({ 
    mapHeaders: ({ header }) => header.trim(), // Entfernt Leerzeichen aus Headern
    skipLines: 0 // Anpassen falls Header nicht in erster Zeile
  }))
  .on('data', (row) => {
    if (row['Player Name'] && row['Player Name'].trim() !== '') {
      players.push(row);
    }
  })
  .on('end', () => {
    console.log(`${players.length} loading players`);
    console.log('Beispielspieler:', players[0]); // Zeigt ersten Eintrag
  })
  .on('error', (err) => {
    console.error('CSV-error:', err);
  });

app.get('/', (req, res) => {
    res.send('Wellcome to the premier league data API !');
});

//Show all players
app.get('/api/players', (req, res) =>{
    res.json(players);
});

app.get('/api/players/:name', (req, res) => {
  const searchName = decodeURIComponent(req.params.name).trim(); // Decodiert %20 zu Leerzeichen
  const player = players.find(p => 
    p['Player Name']?.toLowerCase().trim() === searchName.toLowerCase()
  );
  
  if (!player) {
    console.log(`Searching for "${searchName}". Available Players:`, players.map(p => p['Player Name']));
    return res.status(404).json({ error: 'Player not found', searchedName: searchName });
  }
  
  res.json(player);
});

//Show Team
app.get('/api/:club', (req, res)=>{
    const searchClub = decodeURIComponent(req.params.club).trim().toLowerCase();
    
    const clubPlayers = players.filter(p=>
        p['Club']?.toLowerCase().trim() == searchClub
    );

    if(clubPlayers.length == 0){
        const availableClubs = [...new Set(players.map(p=> p['Club']).filter(Boolean))];
        console.log(`Searching for "${searchClub}". Available Clubs: `, availableClubs);
        return res.status(404).json({ 
            error: 'Club not found', 
            searchedClub: searchClub,
            availableClubs: availableClubs 
        });
    }
    res.json({
        club: searchClub,
        count: clubPlayers.length,
        players: clubPlayers

    });
});

//UPDATE
app.put('/api/transfer',(req,res)=>{
    const {playerName, newClub} = req.body;

    if(!playerName || ! newClub){
        return res.status(404).send('Please enter the name of player and club');
    }

    const player = players.find(p=> 
        p['Player Name']?.toLowerCase() == playerName.toLowerCase()
    );

    const oldClub = player['Club'];
    player['Club' ] == newClub;

    res.send({
        message: `${player['Player Name']} transfered from ${oldClub} to ${newClub}`,
        success: true
    });

});

//DELETE Player
app.delete('/api/players/:name', (req, res)=>{
    const searchName = decodeURIComponent(req.params.name).trim(); 
    const player = players.findIndex(p => 
        p['Player Name']?.toLowerCase().trim() == searchName.toLowerCase()
    );

    if (!player) {
    console.log(`Searching for "${searchName}". Available Players:`, players.map(p => p['Player Name']));
    return res.status(404).json({ error: 'Player not found', searchedName: searchName });
  }
   
  //Removing player from array
  const [deletedPlayer] = players.splice(player,1);

    res.json({
        message: `${deletedPlayer['Player Name']} was successfully deleted`,
        success: true,
        remainingPlayers: players.length
    });
});

// ADD NEW PLAYER
app.post('/api/players', (req, res)=>{
    const {'Player Name' : playerName, Club, Nationality} = req.body;

    // Check if player already exists
    const exists = players.some(p => 
        p['Player Name']?.toLowerCase() === playerName.toLowerCase()
    );
    if (exists) {
        return res.status(409).json({
            error: 'Player already exists',
            existingPlayer: playerName
        });
    }

    const newPlayer = {
        'Player Name': playerName,
        Club,
        Nationality: Nationality || 'Unknown',
        Appearances: 0,
        Goals: 0
    };

    players.push(newPlayer);

    res.json({
        message: `${playerName} was successfully added to ${Club}`,
        success: true,
        remainingPlayers: players.length
    });
});


app.listen(3000,() => console.log("Listening on port 3000.."));