#!/usr/bin/env pwsh
param(
  [string]$Version = "",
  [switch]$Canary = $false,
  [string]$Dir = "",
  [switch]$Help = $false
)

$ErrorActionPreference = "Stop"

$Repo = "merzen-sh/trek-cli"
$BinaryName = "trek"
$Target = "x86_64-pc-windows-msvc"
$ArchiveName = "$BinaryName-$Target.zip"
$BinaryTarget = "$BinaryName-$Target.exe"
$DefaultDir = Join-Path $env:USERPROFILE "trek" "bin"
$InstallDir = if ($Dir) { $Dir } else { $DefaultDir }

function Write-Info  { Write-Host "  [INFO] $args" -ForegroundColor Blue }
function Write-Ok    { Write-Host "  [OK] $args" -ForegroundColor Green }
function Write-Warn  { Write-Host "  [WARN] $args" -ForegroundColor Yellow }
function Write-Err   { Write-Host "  [ERR] $args" -ForegroundColor Red }

function Usage {
  Write-Host @"
Trek CLI Installer

Usage: $($MyInvocation.ScriptName) [options]

Options:
  -Version <version>   Specify version to install (e.g. 0.1.0)
  -Canary              Install the latest canary (pre-release) version
  -Dir <path>          Installation directory (default: ~\trek\bin)
  -Help                Show this help message
"@
  exit 0
}

if ($Help) { Usage }

function Invoke-GitHubAPI {
  param([string]$Path)
  $url = "https://api.github.com/repos/$Repo$Path"
  try {
    return Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = "trek-install/1.0" }
  } catch {
    return $null
  }
}

function Resolve-VersionViaTags {
  $tags = Invoke-GitHubAPI "/tags"
  if ($tags -and $tags.Count -gt 0) {
    $tag = $tags[0]
    return $tag.name -replace '^v', ''
  }
  return $null
}

function Resolve-Version {
  if ($Version) { return }

  if ($Canary) {
    Write-Info "Retrieving latest canary version..."
    $releases = Invoke-GitHubAPI "/releases"
    if ($releases) {
      $canary = $releases | Where-Object { $_.prerelease } | Select-Object -First 1
      if ($canary) {
        $script:Version = $canary.tag_name -replace '^v', ''
        return
      }
    }
    Write-Warn "No canary release found. Falling back to latest tag."
    $tag = Resolve-VersionViaTags
    if ($tag) {
      $script:Version = $tag
      $script:Canary = $false
      return
    }
  }

  if (-not $Version) {
    Write-Info "Retrieving latest stable version..."
    $latest = Invoke-GitHubAPI "/releases/latest"
    if ($latest -and $latest.tag_name) {
      $script:Version = $latest.tag_name -replace '^v', ''
      return
    }
    Write-Warn "No releases found. Falling back to latest tag."
    $tag = Resolve-VersionViaTags
    if ($tag) {
      $script:Version = $tag
      return
    }
  }

  if (-not $Version) {
    Write-Err "Could not determine version to install."
    exit 1
  }
}

function Download-Archive {
  param([string]$Tag)
  $url = "https://github.com/$Repo/releases/download/$Tag/$ArchiveName"
  $out = Join-Path $env:TMP $ArchiveName

  Write-Info "Downloading $ArchiveName for $Tag ..."
  try {
    Invoke-WebRequest -Uri $url -OutFile $out
  } catch {
    Write-Err "Failed to download: $url"
    exit 1
  }
  return $out
}

function Verify-Checksum {
  param([string]$Tag, [string]$ArchivePath)
  $checksumsUrl = "https://github.com/$Repo/releases/download/$Tag/SHASUMS.txt"
  $checksumsFile = Join-Path $env:TMP "SHASUMS.txt"

  Write-Info "Verifying checksum..."
  try {
    Invoke-WebRequest -Uri $checksumsUrl -OutFile $checksumsFile
  } catch {
    Write-Warn "Could not download SHASUMS.txt, skipping verification."
    return
  }

  $lines = Get-Content $checksumsFile
  $expected = $lines | Where-Object { $_ -match "\s\s$([regex]::Escape($ArchiveName))$" } | Select-Object -First 1
  if (-not $expected) {
    Write-Warn "No checksum found for $ArchiveName in SHASUMS.txt."
    return
  }

  $expectedHash = ($expected -split '\s+')[0]
  $actual = (Get-FileHash $ArchivePath -Algorithm SHA256).Hash.ToLower()
  if ($actual -ne $expectedHash.ToLower()) {
    Write-Err "Checksum verification failed!"
    Write-Host "  Expected: $expectedHash" -ForegroundColor Gray
    exit 1
  }
  Write-Ok "Checksum verified."
}

function Extract-AndInstall {
  param([string]$ArchivePath)
  $extractDir = Join-Path $env:TMP "trek-install"
  if (Test-Path $extractDir) { Remove-Item -Recurse -Force $extractDir }
  New-Item -ItemType Directory -Force -Path $extractDir | Out-Null

  Write-Info "Extracting..."
  Expand-Archive -Path $ArchivePath -DestinationPath $extractDir

  Write-Info "Installing to $InstallDir\$BinaryName.exe ..."
  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

  $src = Join-Path $extractDir $BinaryTarget
  $dst = Join-Path $InstallDir "$BinaryName.exe"

  if (-not (Test-Path $src)) {
    Write-Err "Binary not found in archive: $BinaryTarget"
    Get-ChildItem $extractDir | ForEach-Object { Write-Host "  $($_.Name)" }
    exit 1
  }

  Copy-Item $src $dst -Force
}

function Add-ToPath {
  param([string]$PathToAdd)
  $profilePath = $PROFILE.CurrentUserAllHosts
  $profileDir = Split-Path $profilePath -Parent
  if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
  }

  $line = "`$env:Path = `"$PathToAdd;`$env:Path`""
  if (Test-Path $profilePath) {
    $exists = Select-String -Path $profilePath -Pattern [regex]::Escape($PathToAdd) -Quiet
    if (-not $exists) {
      Add-Content -Path $profilePath -Value "`n$line"
      Write-Ok "Added PATH entry to $profilePath"
    }
  } else {
    Set-Content -Path $profilePath -Value $line
    Write-Ok "Added PATH entry to $profilePath"
  }
}

function Update-ShellConfig {
  $dirDisplay = $InstallDir -replace [regex]::Escape($env:USERPROFILE), '~'
  Write-Info "Updating shell configuration..."
  Add-ToPath $InstallDir
  Write-Info "Restart your shell or run: . `$PROFILE"
}

function Main {
  Resolve-Version

  $tag = if ($Version -match '^v') { $Version } else { "v$Version" }
  Write-Info "Selected version: $tag"

  $archivePath = Download-Archive $tag
  Verify-Checksum $tag $archivePath
  Extract-AndInstall $archivePath
  Write-Ok "Trek CLI installed: $InstallDir\$BinaryName.exe"
  Update-ShellConfig
}

Main