<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>403 | Access Denied</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .card {
            max-width: 440px;
            width: 100%;
            text-align: center;
        }

        .code {
            font-size: 96px;
            font-weight: 700;
            line-height: 1;
            background: linear-gradient(135deg, #f87171, #fb923c);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 8px;
        }

        h1 {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #f1f5f9;
        }

        p {
            font-size: 15px;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 28px;
        }

        .actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }

        a.btn {
            display: inline-block;
            padding: 10px 22px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: opacity 0.15s ease;
        }

        a.btn:hover { opacity: 0.85; }

        .btn-primary {
            background: #f1f5f9;
            color: #0f172a;
        }

        .btn-secondary {
            background: transparent;
            color: #cbd5e1;
            border: 1px solid #334155;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="code">403</div>

            <h1>Access Restricted</h1>

            <p>
                {{ $exception->getMessage() ?: 'Sorry, you do not have permission to view this page. If you believe you should have access, please contact your administrator for assistance.' }}
            </p>

            <div class="actions">
                <a href="{{ url('/') }}" class="btn btn-primary">Return to Home</a>
                <a href="{{ url()->previous() }}" class="btn btn-secondary">Previous Page</a>
            </div>
    </div>
</body>
</html>