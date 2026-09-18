# tunnel-watch.ps1 — Mantem o localtunnel vivo e reconecta a instancia Evolution GO automaticamente

$instanceId   = "e4bbbab4-afc5-4eab-8e66-07b8ffedcc5c"
$instanceToken = "fda630910c024ac10d6271ddb75bb373"
$evolutionUrl  = "https://practical-contentment-production-b0e4.up.railway.app"
$envFile       = "$PSScriptRoot\.env"
$backendPort   = 3001
$currentUrl    = ""

function Start-Tunnel {
    Write-Host "[Tunnel] Iniciando localtunnel na porta $backendPort..." -ForegroundColor Cyan
    $job = Start-Job -ScriptBlock {
        param($port)
        npx localtunnel --port $port 2>&1
    } -ArgumentList $backendPort
    return $job
}

function Get-TunnelUrl($job) {
    $timeout = 20
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        $output = Receive-Job $job 2>&1
        if ($output -match "your url is: (https://[^\s]+)") {
            return $matches[1]
        }
        Start-Sleep 1
        $elapsed++
    }
    return $null
}

function Connect-Instance($webhookUrl) {
    $body = "{`"webhookUrl`":`"$webhookUrl/webhook/evolution`",`"subscribe`":[`"ALL`"],`"immediate`":true}"
    try {
        $result = Invoke-RestMethod -Method POST `
            -Uri "$evolutionUrl/instance/connect" `
            -Headers @{"Content-Type"="application/json";"apikey"=$instanceToken;"instanceId"=$instanceId} `
            -Body $body
        Write-Host "[Tunnel] Instancia reconectada: $($result.data.webhookUrl)" -ForegroundColor Green
    } catch {
        Write-Host "[Tunnel] Erro ao reconectar instancia: $_" -ForegroundColor Red
    }
}

function Update-EnvFile($newUrl) {
    if (Test-Path $envFile) {
        (Get-Content $envFile) -replace 'BACKEND_PUBLIC_URL=.*', "BACKEND_PUBLIC_URL=$newUrl" | Set-Content $envFile
    }
}

Write-Host "[Tunnel] Watchdog iniciado. Ctrl+C para parar." -ForegroundColor Yellow

while ($true) {
    $job = Start-Tunnel
    $url = Get-TunnelUrl $job

    if ($url -and $url -ne $currentUrl) {
        $currentUrl = $url
        Write-Host "[Tunnel] Nova URL: $currentUrl" -ForegroundColor Green
        Update-EnvFile $currentUrl
        Connect-Instance $currentUrl
    } elseif (-not $url) {
        Write-Host "[Tunnel] Nao foi possivel obter URL. Tentando novamente em 10s..." -ForegroundColor Yellow
        Remove-Job $job -Force
        Start-Sleep 10
        continue
    }

    # Aguarda enquanto o job estiver a correr
    while ($job.State -eq "Running") {
        Start-Sleep 5
        # Testa se o tunnel ainda responde
        try {
            Invoke-RestMethod -Uri "$currentUrl/health" -TimeoutSec 10 | Out-Null
        } catch {
            Write-Host "[Tunnel] Tunnel nao responde, reiniciando..." -ForegroundColor Yellow
            break
        }
    }

    Write-Host "[Tunnel] Tunnel caiu. Reiniciando em 3s..." -ForegroundColor Yellow
    Remove-Job $job -Force -ErrorAction SilentlyContinue
    $currentUrl = ""
    Start-Sleep 3
}
