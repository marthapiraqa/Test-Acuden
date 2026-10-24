# Ejecuta npm con Node.js local sin modificar el PATH permanente de Windows.
$ErrorActionPreference = 'Stop'
$nodeDirectory = Join-Path $PSScriptRoot '.tools\node-v24.21.0-win-x64'
if (-not (Test-Path -LiteralPath (Join-Path $nodeDirectory 'node.exe'))) {
    throw 'Falta Node.js local. Ejecuta primero .\scripts\setup.ps1'
}
$previousPath = $env:PATH
Push-Location $PSScriptRoot
try {
    $env:PATH = "$nodeDirectory;$previousPath"
    & (Join-Path $nodeDirectory 'npm.cmd') @args
    $result = $LASTEXITCODE
} finally {
    $env:PATH = $previousPath
    Pop-Location
}
exit $result
