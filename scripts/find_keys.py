import os
import re

for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.jsx'):
            path = os.path.join(root, f)
            with open(path, 'r', errors='ignore') as fp:
                lines = fp.readlines()
            for line_no, line in enumerate(lines, 1):
                if 'key=' in line:
                    print(f'{path}:{line_no}: {line.strip()}')
