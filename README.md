# TR*MP TRAIN

TR*MP TRAIN is a retro style snake-like browser game presented in the spirit of parody. Collect assets, employ workers and avoid lawsuits as your corporation grows from humble beginnings to the highest office.

## Playing the Game

1. **Start the Game**
   - Click **Start Game** on the main screen.
   - Choose your desired difficulty: **Fake News (Easy)**, **Tremendous (Normal)**, or **Bigly (Hard)**.

2. **Controls**
   - **Desktop:** Use the arrow keys or WASD to move. Press **Space** to pause.
   - **Mobile:** Swipe on the game board or use the on-screen d-pad.
   - Hold a direction to move continuously at double speed.

3. **Objectives**
   - Collect gold **Assets** ($) to extend your corporate train and earn capital.
   - Grab **Workers** (tie icon) to boost asset values.
   - Exploit **Communities** (people icon) for a burst of capital but watch crisis rise.
   - Dodge red **Lawsuits** (gavel icon). Hitting one ends the game.
   - Keep an eye out for the blue **Twitter Storm** (bird icon) power-up which grants a random bonus.

4. **Phases and Levels**
   - Each bankruptcy advances you to a new level with a new landmark and additional challenges.
   - Inequality and crisis rise as you play. Crisis affects the speed of your train – max crisis doubles the speed.
   - Survive through eight levels, culminating in two presidential terms.

5. **Winning and Losing**
   - Crashing into a wall, yourself or a lawsuit results in game over.
   - Your final score is based on the capital accumulated.

## Difficulty

Difficulty adjusts starting speed and how many lawsuits appear:

| Setting | Speed | Lawsuits |
|---------|-------|---------|
| Fake News (Easy) | Slowest (120ms) | Always 1 |
| Tremendous (Normal) | Medium (90ms) | Starts with 1, +1 each level |
| Bigly (Hard) | Fastest (60ms) | Starts with 3, +1 each level |

Higher crisis levels will accelerate gameplay further.

## Deployment

The repository includes a simple Docker setup using Nginx. Run `docker-compose up` and visit `http://localhost:8080` to play locally.

## License

See [LICENSE](LICENSE) for license information. This project is provided in the spirit of satire; no real person is endorsed or disparaged.