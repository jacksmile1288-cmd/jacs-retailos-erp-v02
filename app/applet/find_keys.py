import os

src_dir = '/app/applet/src' if os.path.exists('/app/applet/src') else 'src'

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.jsx'):
            path = os.path.join(root, f)
            with open(path, 'r', errors='ignore') as fp:
                lines = fp.readlines()
            for line_no, line in enumerate(lines, 1):
                if 'key=' in line:
                    print(f'{path.replace("/app/applet/", "")}:{line_no}: {line.strip()}')
