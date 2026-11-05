@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在下載異色版寶可夢圖片（需要網路，約 1～3 分鐘）...
python 下載寶可夢圖.py
if errorlevel 1 (
  echo.
  echo 找不到 Python 或執行失敗。請先到 https://www.python.org/downloads/ 安裝 Python，安裝時記得勾選 Add Python to PATH。
)
echo.
pause
