#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
push_solutions.py
Reads solutions from topicwise.xlsx and pushes to Firebase
ONLY if the problem has no existing solution.
"""

import json, os, time, sys
import openpyxl, requests

# ── Config ──────────────────────────────────────────────────────────────────
USERNAME = 'saikumar98125'
EXCEL_PATH = os.path.join(os.path.dirname(__file__), 'topicwise.xlsx')
DATA_PATH  = os.path.join(os.path.dirname(__file__), 'public', 'data', 'processed_data.json')
ENV_PATH   = os.path.join(os.path.dirname(__file__), '.env')

# Read Firebase URL from .env
firebase_url = None
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('VITE_FIREBASE_DATABASE_URL='):
                firebase_url = line.split('=', 1)[1].strip().strip('"\'')
                break

if not firebase_url:
    firebase_url = input('Enter Firebase Database URL (https://xxx.firebaseio.com): ').strip()

FB_PROBLEMS = f'{firebase_url}/users/{USERNAME}/problems.json'
print(f'Firebase: {firebase_url}')

# ── Load problem title → ID map from processed_data.json ────────────────────
with open(DATA_PATH, 'r', encoding='utf-8') as f:
    db = json.load(f)

title_to_id = {}
for p in db['problems']:
    title_to_id[p['title'].lower().strip()] = str(p['id'])

print(f'Loaded {len(title_to_id)} problems from processed_data.json')

# ── Parse Excel (Dashboard sheet) ───────────────────────────────────────────
# Structure: row 3 = topic headers, rows 4+ = data
# Every 3 columns starting at index 1: [problem_name, status, solution_code]
wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True)
ws = wb['Dashboard']

excel_solutions = {}   # name_lower -> {name, solution}
for row in ws.iter_rows(min_row=4, values_only=True):
    for i in range(1, len(row) - 2, 3):
        name     = row[i]
        solution = row[i + 2] if i + 2 < len(row) else None
        if (name and isinstance(name, str) and
            solution and isinstance(solution, str) and
            solution.strip() != '#VALUE!' and len(solution.strip()) > 10):
            name = name.strip()
            solution = solution.strip()
            if name:
                excel_solutions[name.lower()] = {'name': name, 'solution': solution}

print(f'Found {len(excel_solutions)} solutions in Excel\n')

# ── Fetch current Firebase data ──────────────────────────────────────────────
resp = requests.get(FB_PROBLEMS)
current = resp.json() or {} if resp.ok else {}
print(f'Current Firebase records: {len(current)}')

# ── Match Excel → problem IDs, skip if solution already exists ───────────────
to_push = {}
no_match = []

for name_lower, info in excel_solutions.items():
    # 1. exact match
    pid = title_to_id.get(name_lower)

    # 2. substring match
    if not pid:
        for t, p in title_to_id.items():
            if name_lower in t or t in name_lower:
                pid = p
                break

    if pid:
        existing = current.get(pid, {})
        if existing and existing.get('solution'):
            print(f'  SKIP  [{pid:>4}] {info["name"]} (already has solution)')
        else:
            to_push[pid] = {
                'solution': info['solution'],
                'language': 'python',
                'progress': existing.get('progress', 'solved'),
                'updatedAt': int(time.time() * 1000)
            }
            print(f'  QUEUE [{pid:>4}] {info["name"]}')
    else:
        no_match.append(info['name'])

print(f'\n--- Summary ---')
print(f'  To push : {len(to_push)}')
print(f'  No match: {len(no_match)}')
if no_match:
    print('  Unmatched:')
    for n in no_match:
        print(f'    - {n}')

if not to_push:
    print('\nNothing to push.')
    sys.exit(0)

# Push to Firebase (PATCH = merge, won't overwrite other fields)
print(f'\nPushing {len(to_push)} solutions...')
resp = requests.patch(FB_PROBLEMS, json=to_push)
if resp.ok:
    print(f'Done! {len(to_push)} solutions pushed successfully.')
else:
    print(f'Error: {resp.status_code} — {resp.text}')
