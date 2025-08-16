@echo off
echo Iniciando servidor HTTP na porta 8000...
echo Acesse: http://localhost:8000
echo Pressione Ctrl+C para parar o servidor

powershell -Command "& {
    Add-Type -AssemblyName System.Net.HttpListener;
    $listener = New-Object System.Net.HttpListener;
    $listener.Prefixes.Add('http://localhost:8000/');
    $listener.Start();
    Write-Host 'Servidor iniciado em http://localhost:8000/';
    Write-Host 'Pressione Ctrl+C para parar';
    
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext();
            $request = $context.Request;
            $response = $context.Response;
            
            $localPath = $request.Url.LocalPath;
            if ($localPath -eq '/') { $localPath = '/index.html' };
            
            $filePath = Join-Path (Get-Location) $localPath.TrimStart('/');
            
            if (Test-Path $filePath) {
                $extension = [System.IO.Path]::GetExtension($filePath);
                switch ($extension) {
                    '.html' { $response.ContentType = 'text/html; charset=utf-8' }
                    '.css' { $response.ContentType = 'text/css' }
                    '.js' { $response.ContentType = 'application/javascript' }
                    '.json' { $response.ContentType = 'application/json' }
                    '.svg' { $response.ContentType = 'image/svg+xml' }
                    default { $response.ContentType = 'text/plain' }
                }
                
                $content = [System.IO.File]::ReadAllBytes($filePath);
                $response.ContentLength64 = $content.Length;
                $response.OutputStream.Write($content, 0, $content.Length);
            } else {
                $response.StatusCode = 404;
                $errorContent = [System.Text.Encoding]::UTF8.GetBytes('404 - Arquivo não encontrado');
                $response.ContentLength64 = $errorContent.Length;
                $response.OutputStream.Write($errorContent, 0, $errorContent.Length);
            }
            
            $response.Close();
        } catch {
            Write-Host 'Erro: ' $_.Exception.Message;
        }
    }
}"