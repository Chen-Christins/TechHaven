[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern("^[A-Za-z0-9.-]+$")]
  [string]$Server,

  [Parameter(Mandatory = $true)]
  [ValidatePattern("^[A-Za-z0-9._-]+$")]
  [string]$User,

  [Parameter(Mandatory = $true)]
  [ValidatePattern("^/[A-Za-z0-9._/-]+$")]
  [string]$DeployRoot,

  [ValidateRange(1, 65535)]
  [int]$Port = 22,

  [string]$IdentityFile,

  [switch]$SkipInstall,
  [switch]$SkipBuild,
  [switch]$PackageOnly,
  [string]$OutputArchive
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($DeployRoot -eq "/" -or $DeployRoot.Contains("..")) {
  throw "DeployRoot must be an absolute, non-root Linux path without '..'."
}

$repoRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$gatewayRoot = Join-Path $repoRoot "services\techhaven-gateway"
$bffRoot = Join-Path $repoRoot "services\techhaven-bff"
$tempBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd("\") + "\"
$workRoot = Join-Path $tempBase ("techhaven-deploy-" + [Guid]::NewGuid().ToString("N"))
$stageRoot = Join-Path $workRoot "release"
$archivePath = Join-Path $workRoot "techhaven-server-release.tgz"

function Assert-Command {
  param([Parameter(Mandatory = $true)][string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found in PATH."
  }
}

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory
  )
  Push-Location $WorkingDirectory
  try {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed (exit=$LASTEXITCODE): $Command $($Arguments -join ' ')"
    }
  } finally {
    Pop-Location
  }
}

function Copy-RequiredItem {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
  )
  if (-not (Test-Path -LiteralPath $Source)) {
    throw "Required release item is missing: $Source"
  }
  Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
}

Assert-Command "npm"
Assert-Command "tar"
if (-not $PackageOnly) {
  Assert-Command "scp"
  Assert-Command "ssh"
}

$resolvedIdentity = $null
if ($IdentityFile) {
  $resolvedIdentity = (Resolve-Path -LiteralPath $IdentityFile).Path
}

try {
  New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

  if (-not $SkipInstall) {
    Write-Host "[1/5] Installing locked dependencies..."
    Invoke-Checked -Command "npm" -Arguments @("ci") -WorkingDirectory $repoRoot
    Invoke-Checked -Command "npm" -Arguments @("ci") -WorkingDirectory $gatewayRoot
    Invoke-Checked -Command "npm" -Arguments @("ci") -WorkingDirectory $bffRoot
  }

  if (-not $SkipBuild) {
    Write-Host "[2/5] Building frontend, Agent Gateway, and BFF..."
    Invoke-Checked -Command "npm" -Arguments @("run", "build") -WorkingDirectory $repoRoot
    Invoke-Checked -Command "npm" -Arguments @("run", "typecheck") -WorkingDirectory $gatewayRoot
    Invoke-Checked -Command "npm" -Arguments @("run", "build") -WorkingDirectory $gatewayRoot
    Invoke-Checked -Command "npm" -Arguments @("run", "typecheck") -WorkingDirectory $bffRoot
    Invoke-Checked -Command "npm" -Arguments @("run", "build") -WorkingDirectory $bffRoot
  }

  Write-Host "[3/5] Creating minimal release archive..."
  Copy-RequiredItem -Source (Join-Path $repoRoot "dist") -Destination (Join-Path $stageRoot "frontend")

  $gatewayStage = Join-Path $stageRoot "services\techhaven-gateway"
  New-Item -ItemType Directory -Path $gatewayStage -Force | Out-Null
  Copy-RequiredItem -Source (Join-Path $gatewayRoot "dist") -Destination (Join-Path $gatewayStage "dist")
  Get-ChildItem -LiteralPath (Join-Path $gatewayStage "dist") -Recurse -Filter "*.test.js" | Remove-Item -Force
  Copy-RequiredItem -Source (Join-Path $gatewayRoot "package.json") -Destination $gatewayStage
  Copy-RequiredItem -Source (Join-Path $gatewayRoot "package-lock.json") -Destination $gatewayStage
  Copy-RequiredItem -Source (Join-Path $gatewayRoot ".env.example") -Destination $gatewayStage

  $bffStage = Join-Path $stageRoot "services\techhaven-bff"
  New-Item -ItemType Directory -Path $bffStage -Force | Out-Null
  Copy-RequiredItem -Source (Join-Path $bffRoot "dist") -Destination (Join-Path $bffStage "dist")
  Get-ChildItem -LiteralPath (Join-Path $bffStage "dist") -Recurse -Filter "*.test.js" | Remove-Item -Force
  Copy-RequiredItem -Source (Join-Path $bffRoot "package.json") -Destination $bffStage
  Copy-RequiredItem -Source (Join-Path $bffRoot "package-lock.json") -Destination $bffStage
  Copy-RequiredItem -Source (Join-Path $bffRoot ".env.example") -Destination $bffStage

  Copy-RequiredItem -Source (Join-Path $repoRoot "contracts") -Destination (Join-Path $stageRoot "contracts")

  $scriptsStage = Join-Path $stageRoot "scripts"
  New-Item -ItemType Directory -Path $scriptsStage -Force | Out-Null
  foreach ($scriptName in @("agent-gateway-service.sh", "install-agent-gateway-systemd.sh", "bff-service.sh")) {
    Copy-RequiredItem -Source (Join-Path $PSScriptRoot $scriptName) -Destination $scriptsStage
  }

  $revision = "working-tree"
  if (Get-Command "git" -ErrorAction SilentlyContinue) {
    $savedErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $candidateRevision = (& git -c core.excludesfile=NUL -C $repoRoot rev-parse --short=12 HEAD 2>$null)
    if ($LASTEXITCODE -eq 0 -and $candidateRevision) {
      $revision = $candidateRevision.Trim()
      $workingTreeStatus = (& git -c core.excludesfile=NUL -C $repoRoot status --porcelain 2>$null)
      if ($LASTEXITCODE -ne 0 -or $workingTreeStatus) { $revision += "-dirty" }
    }
    $ErrorActionPreference = $savedErrorAction
  }
  @(
    "revision=$revision"
    "built_at=$([DateTimeOffset]::UtcNow.ToString('o'))"
  ) | Set-Content -LiteralPath (Join-Path $stageRoot "release-manifest.txt") -Encoding utf8

  Invoke-Checked -Command "tar" -Arguments @("-czf", $archivePath, "-C", $stageRoot, ".") -WorkingDirectory $repoRoot

  if ($PackageOnly) {
    $targetArchive = if ($OutputArchive) {
      [System.IO.Path]::GetFullPath($OutputArchive)
    } else {
      Join-Path $repoRoot "techhaven-server-release.tgz"
    }
    Copy-Item -LiteralPath $archivePath -Destination $targetArchive -Force
    Write-Host "Release archive created: $targetArchive"
    return
  }

  $remoteSuffix = "$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())-$PID"
  $remoteArchive = "/tmp/techhaven-release-$remoteSuffix.tgz"
  $remoteScript = "/tmp/techhaven-deploy-$remoteSuffix.sh"
  $remoteTarget = "${User}@${Server}"
  $scpOptions = @("-P", "$Port")
  $sshOptions = @("-p", "$Port")
  if ($resolvedIdentity) {
    $scpOptions += @("-i", $resolvedIdentity)
    $sshOptions += @("-i", $resolvedIdentity)
  }

  Write-Host "[4/5] Uploading release to ${remoteTarget}..."
  Invoke-Checked -Command "scp" -Arguments ($scpOptions + @($archivePath, "${remoteTarget}:$remoteArchive")) -WorkingDirectory $repoRoot
  Invoke-Checked -Command "scp" -Arguments ($scpOptions + @((Join-Path $PSScriptRoot "deploy-server-release.sh"), "${remoteTarget}:$remoteScript")) -WorkingDirectory $repoRoot

  Write-Host "[5/5] Activating release, restarting, and checking health..."
  Invoke-Checked -Command "ssh" -Arguments ($sshOptions + @($remoteTarget, "bash", $remoteScript, $remoteArchive, $DeployRoot)) -WorkingDirectory $repoRoot
  Write-Host "Deployment complete. Frontend: $DeployRoot/current/frontend; Gateway: http://127.0.0.1:3091; BFF: http://127.0.0.1:3092"
} finally {
  $resolvedWorkRoot = [System.IO.Path]::GetFullPath($workRoot)
  if ($resolvedWorkRoot.StartsWith($tempBase, [System.StringComparison]::OrdinalIgnoreCase) -and
      [System.IO.Path]::GetFileName($resolvedWorkRoot).StartsWith("techhaven-deploy-")) {
    if (Test-Path -LiteralPath $resolvedWorkRoot) {
      Remove-Item -LiteralPath $resolvedWorkRoot -Recurse -Force
    }
  }
}
