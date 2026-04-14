#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
sync_leetcode.py
Fetches all accepted LeetCode submissions and pushes code to Firebase
only if no solution already exists for that problem.

How to get your LEETCODE_SESSION:
  1. Log into leetcode.com in Chrome/Firefox
  2. F12 -> Application -> Cookies -> https://leetcode.com
  3. Copy the value of 'LEETCODE_SESSION'
"""

import json, os, time, sys
import requests

# ── Config ───────────────────────────────────────────────────────────────────
USERNAME_LC  = 'sai_kumar98125'
SESSION      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfYXV0aF91c2VyX2lkIjoiNTY3OTc5MCIsIl9hdXRoX3VzZXJfYmFja2VuZCI6ImFsbGF1dGguYWNjb3VudC5hdXRoX2JhY2tlbmRzLkF1dGhlbnRpY2F0aW9uQmFja2VuZCIsIl9hdXRoX3VzZXJfaGFzaCI6IjcyYzI3ZDNlNjIyOTNkNDc5MjcyNmI5MDRiZTI0YjQ0ZTkyOTNjN2RiNzhmNWEwNGU2MGUzNWVlNjJkM2I4MDkiLCJzZXNzaW9uX3V1aWQiOiI4MDExMTFmZSIsImlkIjo1Njc5NzkwLCJlbWFpbCI6InNhaWt1bWFyOTgxMjVAZ21haWwuY29tIiwidXNlcm5hbWUiOiJzYWlfa3VtYXI5ODEyNSIsInVzZXJfc2x1ZyI6InNhaV9rdW1hcjk4MTI1IiwiYXZhdGFyIjoiaHR0cHM6Ly9hc3NldHMubGVldGNvZGUuY29tL3VzZXJzL2RlZmF1bHRfYXZhdGFyLmpwZyIsInJlZnJlc2hlZF9hdCI6MTc3NjE2MzQ3MCwiaXAiOiIxODMuODIuMTA3LjcxIiwiaWRlbnRpdHkiOiJiODc1NDNlY2JjMGJhNjEwZDlmMDZmOWYyYzQzMmE0NiIsImRldmljZV93aXRoX2lwIjpbIjc3OGY3OWQwYzUwM2U4NDNlOTk2YzM1NmI5OGU4ZjAxIiwiMTgzLjgyLjEwNy43MSJdLCJfc2Vzc2lvbl9leHBpcnkiOjEyMDk2MDB9.BgtsBDI5qDHSPDOJpeGah9JI9IAhhuSCwfAiOAuY5Ts'
CSRF         = 'QsHPGLY0cvk54Hy6t1ZO14en6w88oJcs'
USERNAME_FB  = 'saikumar98125'
ENV_PATH     = os.path.join(os.path.dirname(__file__), '.env')

firebase_url = None
if os.path.exists(ENV_PATH):
    with open(ENV_PATH) as f:
        for line in f:
            if line.strip().startswith('VITE_FIREBASE_DATABASE_URL='):
                firebase_url = line.strip().split('=', 1)[1].strip().strip('"\'')
                break
if not firebase_url:
    firebase_url = input('Firebase Database URL: ').strip()

FB_PROBLEMS = f'{firebase_url}/users/{USERNAME_FB}/problems.json'

HEADERS = {
    'Content-Type': 'application/json',
    'Cookie': f'LEETCODE_SESSION={SESSION}; csrftoken={CSRF}',
    'x-csrftoken': CSRF,
    'Referer': 'https://leetcode.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Origin': 'https://leetcode.com',
}

GQL = 'https://leetcode.com/graphql'

# ── Step 1: fetch all accepted submissions (paginated) ───────────────────────
SUBMISSIONS_QUERY = """
query submissionList($offset: Int!, $limit: Int!, $lastKey: String) {
  submissionList(offset: $offset, limit: $limit, lastKey: $lastKey) {
    lastKey
    hasNext
    submissions {
      id
      title
      titleSlug
      statusDisplay
      lang
      timestamp
      url
    }
  }
}
"""

print('\nFetching accepted submissions from LeetCode...')
accepted = {}   # titleSlug -> {id, title, titleSlug, lang, timestamp, url}

limit    = 20
offset   = 0
page     = 1
prev_count = 0

while True:
    resp = requests.post(GQL, json={
        'operationName': 'submissionList',
        'query': SUBMISSIONS_QUERY,
        'variables': {'offset': offset, 'limit': limit, 'lastKey': None}
    }, headers=HEADERS, timeout=15)

    if not resp.ok:
        print(f'Error fetching submissions: {resp.status_code}')
        break

    data = resp.json().get('data', {}).get('submissionList', {})
    subs = data.get('submissions', [])

    if not subs:
        break

    for s in subs:
        if s['statusDisplay'] == 'Accepted':
            slug = s['titleSlug']
            if slug not in accepted or int(s['timestamp']) > int(accepted[slug]['timestamp']):
                accepted[slug] = s

    print(f'  Page {page}: {len(subs)} submissions, {len(accepted)} unique accepted so far')

    # If no new accepted problems found in this page, stop
    if len(accepted) == prev_count and page > 3:
        print('  No new accepted found, stopping.')
        break

    if not data.get('hasNext'):
        break

    prev_count = len(accepted)
    offset    += limit
    page      += 1
    time.sleep(0.5)

print(f'\nTotal unique accepted problems: {len(accepted)}')

# ── Step 2: fetch code for each accepted submission ───────────────────────────
DETAIL_QUERY = """
query submissionDetails($submissionId: Int!) {
  submissionDetails(submissionId: $submissionId) {
    code
    lang { name }
    statusCode
  }
}
"""

print('\nFetching solution code for each accepted submission...')
solutions = {}   # titleSlug -> {code, lang}

for i, (slug, sub) in enumerate(accepted.items(), 1):
    sub_id = int(sub['id'])
    resp = requests.post(GQL, json={
        'operationName': 'submissionDetails',
        'query': DETAIL_QUERY,
        'variables': {'submissionId': sub_id}
    }, headers=HEADERS, timeout=15)

    if resp.ok:
        detail = resp.json().get('data', {}).get('submissionDetails')
        if detail and detail.get('code'):
            solutions[slug] = {
                'code': detail['code'],
                'lang': detail.get('lang', {}).get('name', 'python3') if isinstance(detail.get('lang'), dict) else detail.get('lang', 'python3')
            }
            print(f'  [{i}/{len(accepted)}] {sub["title"]}')
        else:
            print(f'  [{i}/{len(accepted)}] {sub["title"]} — no code returned')
    else:
        print(f'  [{i}/{len(accepted)}] {sub["title"]} — HTTP {resp.status_code}')

    time.sleep(0.3)

print(f'\nFetched code for {len(solutions)} problems')

# ── Step 3: map titleSlug -> problem ID via processed_data.json ──────────────
DATA_PATH = os.path.join(os.path.dirname(__file__), 'public', 'data', 'processed_data.json')
with open(DATA_PATH, encoding='utf-8') as f:
    db = json.load(f)

slug_to_id = {}
for p in db['problems']:
    lc_slug = p['title'].lower().replace(' ', '-').replace('(', '').replace(')', '').replace(',', '').replace("'", '').replace('/', '-')
    slug_to_id[lc_slug] = str(p['id'])
    # also store by raw title slug pattern
    slug_to_id[p['title'].lower().replace(' ', '-')] = str(p['id'])

# ── Step 4: fetch current Firebase data ──────────────────────────────────────
print('\nFetching current Firebase data...')
resp = requests.get(FB_PROBLEMS)
current = resp.json() or {} if resp.ok else {}
print(f'Current Firebase records: {len(current)}')

# ── Step 5: push missing solutions ───────────────────────────────────────────
LANG_MAP = {
    'python': 'python', 'python3': 'python',
    'javascript': 'javascript', 'typescript': 'typescript',
    'java': 'java', 'cpp': 'cpp', 'c': 'c',
    'csharp': 'csharp', 'go': 'go', 'rust': 'rust',
    'kotlin': 'kotlin', 'swift': 'swift',
}

to_push  = {}
no_match = []

for slug, sol in solutions.items():
    pid = slug_to_id.get(slug)
    if not pid:
        # try stripping trailing numbers / variants
        base = '-'.join(slug.split('-')[:-1])
        pid  = slug_to_id.get(base)

    if pid:
        existing = current.get(pid, {})
        if existing and existing.get('solution'):
            pass  # already has solution, skip silently
        else:
            to_push[pid] = {
                'solution': sol['code'],
                'language': LANG_MAP.get(sol['lang'], sol['lang']),
                'progress': existing.get('progress', 'solved'),
                'updatedAt': int(time.time() * 1000)
            }
    else:
        no_match.append(slug)

print(f'\n--- Summary ---')
print(f'  Accepted on LeetCode : {len(accepted)}')
print(f'  Code fetched         : {len(solutions)}')
print(f'  Already in Firebase  : {len(solutions) - len(to_push) - len(no_match)}')
print(f'  To push              : {len(to_push)}')
print(f'  No ID match          : {len(no_match)}')

if not to_push:
    print('\nNothing new to push.')
    sys.exit(0)

print(f'\nPushing {len(to_push)} solutions to Firebase...')
resp = requests.patch(FB_PROBLEMS, json=to_push)
if resp.ok:
    print(f'Done! {len(to_push)} solutions pushed successfully.')
else:
    print(f'Error: {resp.status_code} — {resp.text}')
