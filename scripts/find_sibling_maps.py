import os
import re

for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path) as fp:
                content = fp.read()
            # Find any JSX tags containing more than one .map(
            # e.g. <select ...> ... .map ... .map ... </select>
            # or <datalist ...> ... </datalist>
            # or <tbody> ... </tbody>
            for tag in ['select', 'datalist', 'tbody', 'div', 'ul']:
                pattern = rf'<{tag}[^>]*>(.*?)</{tag}>'
                for m in re.finditer(pattern, content, re.DOTALL):
                    body = m.group(1)
                    maps = re.findall(r'(\w+)\.map\(', body)
                    if len(maps) > 1:
                        print(f"File: {path} in <{tag}>: mapped arrays = {maps}")
