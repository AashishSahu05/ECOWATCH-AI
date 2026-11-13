import os
import re

PATTERNS = [
    ('Google/Gemini API Key', re.compile(r'AIza[0-9A-Za-z-_]{35}')),
    ('JWT Token', re.compile(r'eyJ[A-Za-z0-9-_]{25,}\.eyJ[A-Za-z0-9-_]{25,}\.[A-Za-z0-9-_]{25,}')),
    ('Private Key', re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----')),
    ('High Entropy Secret', re.compile(r'(?:api_key|secret_key|private_key|service_role)\s*[:=]\s*["\']([a-zA-Z0-9_\-]{20,})["\']', re.IGNORECASE)),
]

IGNORE_DIRS = {'node_modules', '.next', '.git', 'out', 'build', 'dist', '.gemini'}
IGNORE_FILES = {'.env.local', 'package-lock.json'}

findings = []

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
    for file in files:
        if file in IGNORE_FILES:
            continue
        filepath = os.path.join(root, file)
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                for label, pat in PATTERNS:
                    matches = pat.findall(content)
                    for m in matches:
                        match_str = m if isinstance(m, str) else m[0]
                        # Allow explicit dummy test secrets
                        if any(safe in match_str for safe in ['test-only-secret', 'your_', 'placeholder', 'dummy', 'mock_jwt_']):
                            continue
                        findings.append((filepath, label, match_str[:12] + '...'))
        except Exception:
            pass

print(f"Total findings: {len(findings)}")
for item in findings:
    print(f"FILE: {item[0]} | TYPE: {item[1]} | SAMPLE: {item[2]}")
