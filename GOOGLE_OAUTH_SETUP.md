# Google OAuth Setup Instructions

## Why Google OAuth is not working

Your Google OAuth login is not working because the required environment variables are not set. The application needs these credentials to authenticate with Google.

## Required Environment Variables

You need to set these environment variables in your backend:

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FRONTEND_URL=http://localhost:5173
```

## How to Get Google OAuth Credentials

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### Step 2: Enable Google+ API
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google OAuth2 API" if available

### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add these Authorized redirect URIs:
   - `Access blocked: This app’s request is invalid

amanrohilla520@gmail.com
You can’t sign in because this app sent an invalid request. You can try again later or contact the developer about this issue. Learn more about this error
If you are a developer of this app, see error details.
Error 400: redirect_uri_mismatch`
   - `http://localhost:5173/oauth-success`
5. Click "Create"

### Step 4: Copy Credentials
1. Copy the Client ID and Client Secret
2. Add them to your environment variables

## Setting Environment Variables

### Option 1: Create a .env file (Recommended)
Create a `.env` file in your `backend` folder:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
DB_URL=mongodb://localhost:27017/farmconnect
```

### Option 2: Set in your system
Set these as system environment variables before running your server.

## Current Status

- ✅ **Backend**: Ready to handle Google OAuth when credentials are provided
- ✅ **Frontend**: Ready to handle Google OAuth responses
- ✅ **Error Handling**: Shows helpful messages when OAuth is not configured
- ❌ **Google OAuth**: Not working due to missing credentials

## After Setup

Once you add the environment variables:
1. Restart your backend server
2. The Google OAuth login button will work
3. Users can sign in with their Google accounts
4. New users will be automatically created with basic info
5. Users can complete their profile (phone, role) later

## Security Notes

- Never commit your `.env` file to version control
- Use strong, unique values for JWT_SECRET
- In production, use HTTPS URLs for FRONTEND_URL
- Regularly rotate your Google OAuth credentials
