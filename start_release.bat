@echo off
REM Simple start script for release packages (Windows)
REM - Copies .env.example -> .env if missing

nIF NOT EXIST .env (
  IF EXIST .env.example (
    copy .env.example .env >nul
    echo Created .env from .env.example. Edit .env if you want to change settings before starting.
  ) ELSE (
    echo Warning: .env.example not found. Creating empty .env
    type nul > .env
  )
)

echo Starting Pulse Deck (release)...
node server.js
