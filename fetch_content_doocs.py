#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
fetch_content_doocs.py
Fetches blank problem content from doocs/leetcode GitHub repo (no premium needed)
and updates processed_data.json
"""
import json, os, time, re, sys
import requests

sys.stdout.reconfigure(encoding='utf-8')

DATA_PATH = os.path.join(os.path.dirname(__file__), 'public', 'data', 'processed_data.json')

def make_range(pid):
    base = (pid // 100) * 100
    return f'{base:04d}-{base+99:04d}'

def make_url(pid, title):
    # doocs folder: {id:04d}.{Title With Spaces}
    folder = f'{pid:04d}.{title}'
    rng = make_range(pid)
    encoded = requests.utils.quote(folder, safe='.')
    return f'https://raw.githubusercontent.com/doocs/leetcode/main/solution/{rng}/{encoded}/README_EN.md'

def extract_content(md):
    # Extract HTML between <!-- description:start --> and <!-- description:end -->
    m = re.search(r'<!-- description:start -->(.*?)<!-- description:end -->', md, re.DOTALL)
    if m:
        return m.group(1).strip()
    # Fallback: extract ## Description section
    m = re.search(r'## Description\s*\n(.*?)(?=\n## |\Z)', md, re.DOTALL)
    if m:
        return m.group(1).strip()
    return None

# Load data
print('Loading processed_data.json...')
with open(DATA_PATH, encoding='utf-8') as f:
    data = json.load(f)

problems = data['problems']
blank = [p for p in problems if not p.get('content') or p['content'].strip() == '']
print(f'Found {len(blank)} blank problems\n')

id_to_idx = {p['id']: i for i, p in enumerate(problems)}
filled = 0
failed = []

for i, p in enumerate(blank, 1):
    pid = int(p['id'])
    url = make_url(pid, p['title'])

    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 404:
            # Try URL-encoding the title differently
            folder2 = f"{pid:04d}.{p['title'].replace(' ', '%20')}"
            rng = make_range(pid)
            url2 = f'https://raw.githubusercontent.com/doocs/leetcode/main/solution/{rng}/{folder2}/README_EN.md'
            resp = requests.get(url2, timeout=10)

        if resp.ok:
            content = extract_content(resp.text)
            if content:
                idx = id_to_idx[p['id']]
                problems[idx]['content'] = content
                filled += 1
                print(f'  [{i}/{len(blank)}] OK   [{pid}] {p["title"]}')
            else:
                failed.append(p['title'])
                print(f'  [{i}/{len(blank)}] EMPTY [{pid}] {p["title"]}')
        else:
            failed.append(p['title'])
            print(f'  [{i}/{len(blank)}] {resp.status_code}  [{pid}] {p["title"]}')
    except Exception as e:
        failed.append(p['title'])
        print(f'  [{i}/{len(blank)}] ERR  [{pid}] {p["title"]}: {e}')

    # Save atomically every 25 (temp file + rename = no corruption on interrupt)
    if i % 25 == 0:
        tmp = DATA_PATH + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
        os.replace(tmp, DATA_PATH)
        print(f'  === Saved progress: {filled} filled so far ===')

    time.sleep(0.3)

# Final atomic save
tmp = DATA_PATH + '.tmp'
with open(tmp, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
os.replace(tmp, DATA_PATH)

print(f'\nDone! Filled: {filled}/{len(blank)}')
if failed:
    print(f'Still blank ({len(failed)}):')
    for t in failed[:20]:
        print(f'  - {t}')
