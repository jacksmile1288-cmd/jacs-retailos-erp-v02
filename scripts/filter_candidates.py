import os

file_path = '/tmp/all_keys.txt'
if os.path.exists(file_path):
    with open(file_path) as f:
        lines = [l.strip() for l in f if l.strip()]
else:
    lines = []

candidates = []
for l in lines:
    if 'key={`' in l:
        val = l.split('key={`')[1].split('`}')[0]
        parts = val.split('${')
        prefix = parts[0]
        if prefix:
            continue
    candidates.append(l)

print(f'Total candidates: {len(candidates)}')
for c in candidates:
    print(c)
