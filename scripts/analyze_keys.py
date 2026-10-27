import os
import re

file_path = '/tmp/all_keys.txt'
if os.path.exists(file_path):
    with open(file_path) as f:
        lines = [l.strip() for l in f if l.strip()]
else:
    lines = []

for l in lines:
    m = re.search(r'key=({[^}]+}|"[^"]+"|\'[^\']+\')', l)
    if m:
        key_val = m.group(1)
        print(f"{key_val:40} | {l}")
