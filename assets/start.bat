@echo off


set JAVA="java"
set JAR="Lavalink.jar"

title GN #1
%JAVA% -Xms128M -Xmx2048M -jar %JAR%

pause