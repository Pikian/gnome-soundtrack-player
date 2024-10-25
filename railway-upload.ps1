# Enable error details



$ErrorActionPreference = "Stop"







# First verify we're connected to Railway



Write-Host "Checking Railway connection..." -ForegroundColor Green



$railwayStatus = railway status



Write-Host $railwayStatus







# Function to upload a file



function Upload-File {



    param (



        [string]$sourcePath,



        [string]$destinationPath



    )



    



    Write-Host "Uploading $sourcePath to $destinationPath" -ForegroundColor Yellow



    try {



        # Convert file content to base64



        $content = [Convert]::ToBase64String([IO.File]::ReadAllBytes($sourcePath))



        



        # Create command to decode and write file



        $command = "echo '$content' | base64 --decode > '$destinationPath'"



        



        # Execute command on Railway



        railway run --service backend "bash -c `"$command`""



        



        Write-Host "Successfully uploaded $sourcePath" -ForegroundColor Green



    }



    catch {



        Write-Host "Failed to upload $sourcePath : $_" -ForegroundColor Red



    }



}







# Create the media directory



Write-Host "`nCreating media directory..." -ForegroundColor Green



railway run --service backend "mkdir -p /app/media"







# Upload MP3 files



Write-Host "`nUploading MP3 files..." -ForegroundColor Green



Get-ChildItem ".\backend\media\*.mp3" | ForEach-Object {



    Upload-File $_.FullName "/app/media/$($_.Name)"



}







# Upload PNG files



Write-Host "`nUploading image files..." -ForegroundColor Green



Get-ChildItem ".\backend\media\*.png" | ForEach-Object {



    Upload-File $_.FullName "/app/media/$($_.Name)"



}







# Upload metadata.json



Write-Host "`nUploading metadata.json..." -ForegroundColor Green



Upload-File ".\backend\metadata.json" "/app/metadata.json"







# Verify files



Write-Host "`nVerifying uploaded files..." -ForegroundColor Green



railway run --service backend "ls -la /app/media"






