# 'Subtitles' TRMNL Movie Quote Plugin Backend
This plugin generates random movie quotes on your TRMNL from AFI's Top 100 Movie Quotes list and makes a guessing game out of it. 

How To Make This Work
You will need a Web Service to use for the Polling URL in your plugin. So, If you don't have this set up already an easy way is to use Render...

1. Sign Up: Go to render.com and log in with your GitHub account.
2. Create Web Service: Click New + in the top dashboard navbar and select Web Service.
3. Connect Repository: You'll probably need to fork this repo to use for the setup. Select the forked repository from your GitHub connection menu list.
4. Configure Deployment Settings: Use these settings to set up the runtime:
	• Language: Python
	• Region: Choose the region closest to you.
	• Branch: main
	• Build Command: pip install -r requirements.txt
	• Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
	• Instance Type: Select the Free tier.
5. Deploy: Click Create Web Service. Within a few minutes, Render will output a live URL (e.g., https://repo-name.onrender.com).
6. Set Polling Target: Paste the live URL directly into your TRMNL Polling URL field.

NOTE: There is a spin-up delay in the free tier that causes a 30-50 second delay to connect after 15 minutes of inactivity. You'll have to swap to a paid tier to avoid this but I don't mind a slight delay. 

The markup for the plugin is already in place. 

