$ErrorActionPreference = 'Stop'
$root = (Resolve-Path $PSScriptRoot).Path
$contentTypes = @{
    '.css'  = 'text/css; charset=utf-8'
    '.gif'  = 'image/gif'
    '.html' = 'text/html; charset=utf-8'
    '.ico'  = 'image/x-icon'
    '.jpeg' = 'image/jpeg'
    '.jpg'  = 'image/jpeg'
    '.js'   = 'text/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.webmanifest' = 'application/manifest+json; charset=utf-8'
    '.png'  = 'image/png'
    '.svg'  = 'image/svg+xml'
    '.txt'  = 'text/plain; charset=utf-8'
    '.webp' = 'image/webp'
    '.xml'  = 'application/xml; charset=utf-8'
}
$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add('http://localhost:8000/')
$listener.Start()

Write-Host "COMMANDO is running at http://localhost:8000/"
Write-Host 'Press Ctrl+C to stop the server.'

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $relativePath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                $relativePath = 'index.html'
            }

            $filePath = [IO.Path]::GetFullPath((Join-Path $root $relativePath))
            if (-not $filePath.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or
                -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
                $context.Response.StatusCode = 404
                $context.Response.Close()
                continue
            }

            $bytes = [IO.File]::ReadAllBytes($filePath)
            $extension = [IO.Path]::GetExtension($filePath).ToLowerInvariant()
            if ($contentTypes.ContainsKey($extension)) {
                $context.Response.ContentType = $contentTypes[$extension]
            }
            else {
                $context.Response.ContentType = 'application/octet-stream'
            }
            $context.Response.ContentLength64 = $bytes.Length
            try {
                $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            catch [System.IO.IOException] {
                Write-Warning 'The client disconnected before the response finished.'
            }
            catch [System.Net.HttpListenerException] {
                Write-Warning 'The client disconnected before the response finished.'
            }
        }
        finally {
            $context.Response.Close()
        }
    }
}
finally {
    $listener.Stop()
    $listener.Close()
}
