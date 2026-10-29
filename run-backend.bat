@echo off
title MediStore Backend (Spring Boot)
cd /d "%~dp0javamedi"
echo ========================================================
echo  Starting MediStore Backend (Spring Boot) on port 8081
echo  Database: MySQL (medi_db)
echo  Swagger UI: http://localhost:8081/swagger-ui/index.html
echo ========================================================
.\gradlew.bat bootRun --args="--spring.profiles.active=dev"
pause
