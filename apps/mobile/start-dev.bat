@echo off
cd /d "%~dp0"
flutter run -d web-server --web-port 8766 --dart-define=API_BASE_URL=https://api.weeelink.ir/api/v1
