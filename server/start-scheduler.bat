@echo off
REM Roster Scheduler - Windows Startup Script
REM This script starts the PM2 roster scheduler

echo Starting Roster Scheduler...
cd /d "C:\PetProjects\Playout\server"
pm2 resurrect
pm2 status

echo.
echo Roster Scheduler is running!
echo To view logs: pm2 logs roster-scheduler
echo To stop: pm2 stop roster-scheduler
echo To restart: pm2 restart roster-scheduler
