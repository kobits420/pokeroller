# Pokemon Roller Backend

This is the backend API for the Pokemon Roller game, built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT tokens
- Game progress persistence
- Achievement system
- User profiles and statistics
- Leaderboard functionality
- Inventory management
- Avatar customization

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/pokeroller
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

3. Start MongoDB (if running locally):
```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
```

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Game
- `POST /api/game/save` - Save game progress (protected)
- `GET /api/game/progress` - Get game progress (protected)
- `POST /api/game/achievements/claim` - Claim achievement (protected)
- `POST /api/game/titles/equip` - Equip title (protected)
- `POST /api/game/favorites` - Update favorites (protected)
- `POST /api/game/inventory` - Update inventory (protected)
- `POST /api/game/avatar` - Update avatar (protected)

### User Management
- `GET /api/user/profile` - Get user profile (protected)
- `PUT /api/user/profile` - Update user profile (protected)
- `PUT /api/user/password` - Change password (protected)
- `GET /api/user/leaderboard` - Get leaderboard
- `GET /api/user/stats` - Get user statistics (protected)
- `DELETE /api/user/account` - Delete account (protected)

### Health Check
- `GET /api/health` - Server health check

## Database Schema

### User Model
- `username` - Unique username
- `password` - Hashed password
- `avatar` - User avatar filename
- `coins` - Game currency (0-24)
- `lastCoinTime` - Last coin collection time
- `lastLoginDate` - Last login date for daily bonus
- `level` - User level
- `xp` - Experience points
- `xpToNext` - XP needed for next level
- `cardCounts` - Map of Pokemon ID to count
- `packsOpened` - Total packs opened
- `claimedAchievements` - Array of claimed achievement IDs
- `completedAchievements` - Array of completed achievement IDs
- `equippedTitle` - Currently equipped title
- `favorites` - Array of favorite Pokemon IDs
- `inventory` - Map of item names to quantities

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation and sanitization

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running in Production Mode
```bash
npm start
```

### Environment Variables

- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

## Integration with Frontend

The frontend can use the `utils/apiClient.js` file to communicate with this backend. The API client handles:

- Authentication token management
- Request/response formatting
- Error handling
- Automatic token refresh

## Deployment

1. Set up a MongoDB database (local or cloud)
2. Configure environment variables for production
3. Deploy to your preferred hosting platform (Heroku, Vercel, etc.)
4. Update the frontend API client with the production URL

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message"
}
```

HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error 