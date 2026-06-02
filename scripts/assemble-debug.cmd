@echo off
REM Build debug APK with Java 11+ (AGP 8.x). Picks a JDK with valid SSL trust store.
setlocal EnableDelayedExpansion
set "ROOT=%~dp0.."
set "ANDROID=%ROOT%\android"

set "JAVA_HOME="
for %%J in (
  "E:\download2\Android Studio\jbr"
  "%ProgramFiles%\JetBrains\IntelliJ IDEA Community Edition 2023.1\jbr"
  "%ProgramFiles%\JetBrains\IntelliJ IDEA Community Edition 2022.3.2\jbr"
  "%ProgramFiles%\Java\IntelliJ IDEA Community Edition 2022.3.2\jbr"
  "%ProgramFiles%\Android\Android Studio\jbr"
  "%LOCALAPPDATA%\Programs\Android Studio\jbr"
  "%ProgramFiles%\Java\jdk-21"
  "%ProgramFiles%\Java\jdk-17"
  "%ProgramFiles%\Java\jdk-17.0.4"
  "%ProgramFiles%\Eclipse Adoptium\jdk-17.0.13.11-hotspot"
  "%ProgramFiles%\Microsoft\jdk-17.0.13.11-hotspot"
) do (
  set "CAND=%%~J"
  if exist "!CAND!\bin\java.exe" (
    if exist "!CAND!\lib\security\cacerts" (
      set "JAVA_HOME=!CAND!"
      goto found
    )
    if exist "!CAND!\lib\security\cacerts.pem" (
      set "JAVA_HOME=!CAND!"
      goto found
    )
    echo Skip - no cacerts - !CAND!
  )
)

if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" goto found

echo ERROR: No usable Java 11+ found.
echo.
echo Easiest: open Android Studio and use Build - Generate APK (uses Studio JDK).
echo.
echo Or install JDK 17: https://adoptium.net/ then:
echo   set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17..."
echo   npm run apk:debug
exit /b 1

:found
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo Using JAVA_HOME=%JAVA_HOME%
"%JAVA_HOME%\bin\java.exe" -version
echo.

cd /d "%ANDROID%"
call gradlew.bat assembleDebug
set "ERR=%ERRORLEVEL%"
if not "%ERR%"=="0" (
  echo.
  echo If SSL / trustAnchors errors: build APK inside Android Studio instead,
  echo or install a fresh JDK 17 from https://adoptium.net/
  exit /b %ERR%
)

echo.
echo APK: %ANDROID%\app\build\outputs\apk\debug\app-debug.apk
exit /b 0
