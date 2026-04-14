#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
push_manual.py — pushes the 9 manually-mapped unmatched solutions
"""
import json, os, time, sys
import openpyxl, requests

USERNAME = 'saikumar98125'
EXCEL_PATH = os.path.join(os.path.dirname(__file__), 'topicwise.xlsx')
DATA_PATH  = os.path.join(os.path.dirname(__file__), 'public', 'data', 'processed_data.json')
ENV_PATH   = os.path.join(os.path.dirname(__file__), '.env')

firebase_url = None
if os.path.exists(ENV_PATH):
    with open(ENV_PATH) as f:
        for line in f:
            if line.strip().startswith('VITE_FIREBASE_DATABASE_URL='):
                firebase_url = line.strip().split('=', 1)[1].strip().strip('"\'')
                break
if not firebase_url:
    firebase_url = input('Firebase URL: ').strip()

FB_PROBLEMS = f'{firebase_url}/users/{USERNAME}/problems.json'

# Manual name → LeetCode ID mapping
MANUAL_MAP = {
    'detect loop (floyd)':                          '141',   # Linked List Cycle
    'remove loop':                                  '142',   # Linked List Cycle II (closest LC equivalent)
    'find middle':                                  '876',   # Middle of the Linked List
    'length of longest valid substring (2024 favorite)': '2781', # Length of the Longest Valid Substring
    'triplet with given sum':                       '15',    # 3Sum
    'search in 2d matrix (sorted rows/cols)':       '240',   # Search a 2D Matrix II
    'array rotation':                               '189',   # Rotate Array
    'boundary traversal':                           '545',   # Boundary of Binary Tree
    'buy/sell stock (all variants)':                '121',   # Best Time to Buy and Sell Stock
}

# Load solutions from Excel
wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True)
ws = wb['Dashboard']

excel_solutions = {}
for row in ws.iter_rows(min_row=4, values_only=True):
    for i in range(1, len(row) - 2, 3):
        name     = row[i]
        solution = row[i + 2] if i + 2 < len(row) else None
        if (name and isinstance(name, str) and
            solution and isinstance(solution, str) and
            solution.strip() != '#VALUE!' and len(solution.strip()) > 10):
            excel_solutions[name.strip().lower()] = solution.strip()

# Fetch current Firebase data
resp = requests.get(FB_PROBLEMS)
current = resp.json() or {} if resp.ok else {}
print(f'Current Firebase records: {len(current)}\n')

# Verify each problem ID exists in processed_data.json
with open(DATA_PATH, encoding='utf-8') as f:
    db_ids = {str(p['id']) for p in json.load(f)['problems']}

to_push = {}
for excel_name_lower, pid in MANUAL_MAP.items():
    solution = excel_solutions.get(excel_name_lower)
    if not solution:
        print(f'  NO SOLUTION in Excel: {excel_name_lower}')
        continue

    if pid not in db_ids:
        print(f'  ID {pid} not in processed_data.json — skipping (premium?): {excel_name_lower}')
        continue

    existing = current.get(pid, {})
    if existing and existing.get('solution'):
        print(f'  SKIP  [{pid:>4}] {excel_name_lower} (already has solution)')
        continue

    to_push[pid] = {
        'solution': solution,
        'language': 'python',
        'progress': existing.get('progress', 'solved'),
        'updatedAt': int(time.time() * 1000)
    }
    print(f'  QUEUE [{pid:>4}] {excel_name_lower}')

print(f'\nTo push: {len(to_push)}')
if not to_push:
    print('Nothing to push.')
    sys.exit(0)

resp = requests.patch(FB_PROBLEMS, json=to_push)
if resp.ok:
    print(f'Done! {len(to_push)} solutions pushed.')
else:
    print(f'Error: {resp.status_code} — {resp.text}')
