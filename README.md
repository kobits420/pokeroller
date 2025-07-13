# PokeRoller

A web-based Pokémon collection game where players can roll for Pokémon, build their collection, and interact with friends.

## Features

- **Pokémon Rolling**: Roll for random Pokémon with different rarities
- **Collection Management**: Track caught Pokémon, view stats, and manage your collection
- **Friends System**: Add friends, send friend requests, and chat with them
- **Achievements**: Complete milestones to earn bonus rolls and rewards
- **Shop System**: Purchase items to enhance your gameplay
- **Real-time Chat**: Communicate with friends using Socket.IO
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT tokens
- **Web Server**: Nginx (for production)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Nginx (for production setup)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pokeroller.git
   cd pokeroller
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/pokeroller
   JWT_SECRET=your-secret-key-here
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   or for development with auto-restart:
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Development: Open `index.html` in your browser
   - Production: Visit `http://your-domain.com`

## Project Structure

```
pokeroller/
├── config/           # Configuration files
├── middleware/       # Express middleware
├── models/          # MongoDB models
├── routes/          # API routes
├── scripts/         # Utility scripts
├── sounds/          # Audio files
├── sprites/         # Pokémon and trainer sprites
├── styles/          # CSS files
├── utils/           # Utility functions
├── components/      # UI components
├── server.js        # Main server file
├── main.js          # Frontend entry point
└── index.html       # Main HTML file
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile
- `POST /api/game/roll` - Roll for Pokémon
- `GET /api/user/friends` - Get user's friends
- `POST /api/user/friends/add` - Add friend
- `GET /api/health` - Health check

## Development

### Running Locally

1. Start MongoDB
2. Set up your `.env` file
3. Run `npm start`
4. Open `index.html` in your browser

### Production Setup

1. Set up Nginx with the provided configuration
2. Configure your domain in the hosts file
3. Start the Node.js server
4. Access via your domain

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Pokémon sprites and assets
- Sound effects and audio
- Community contributors

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 