This project is a game based on the Sonic the Hedgehog series. It is inspired by Kahoot, Jackbox, and other trivia games.

## Features
- Multiple choice questions.
- Timer for each question.
- Leaderboard tracking.
- Customizable questions and answers.
- Support for multiplayer gameplay.
- Guess that game which features songs from the Sonic the Hedgehog series.
- Ability to create lobbies.
- Ability to create custom set list for guess that game and trivia with difficulties.
- Have unique abilities per character.

## Setting up
### Prerequisites
- [Node.js and npm](https://nodejs.org/) installed on your machine.
- [Bun](https://bun.sh/) installed on your machine.
- [Docker](https://www.docker.com/) installed on your machine.
- Make if on [windows](https://gnuwin32.sourceforge.net/packages/make.html)

To set up the project, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/sonic-trivia.git
   ```

2. Navigate to the project directory:
   ```
   cd sonic-trivia
   ```

3. Install dependencies:
   ```
   bun i in the frontend directory
   ```

4. Start the development server:
   ```
   bun run start
   ```
5. Copy a copy of the env.example and rename it to env.
6. Run make dev-db-reset to initialize the database:
   ```
   make dev-db-reset
   ```
7. Go to http://localhost:5176 to play the game.

## Credits
[Sega](https://www.sega.com/) - For publishing and keeping the Sonic the Hedgehog series alive.
Sonic Team - For making the Sonic the Hedgehog series.
Dimps - For creating Sonic Rush where sprites were used from.
Sonic Wiki - For providing information about the Sonic the Hedgehog series, as well as sprites.
