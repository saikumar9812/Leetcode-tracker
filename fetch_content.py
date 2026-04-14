#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
fetch_content.py
Fetches missing problem content from LeetCode and updates processed_data.json
"""
import json, os, time, sys
import requests

SESSION = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfYXV0aF91c2VyX2lkIjoiNTY3OTc5MCIsIl9hdXRoX3VzZXJfYmFja2VuZCI6ImFsbGF1dGguYWNjb3VudC5hdXRoX2JhY2tlbmRzLkF1dGhlbnRpY2F0aW9uQmFja2VuZCIsIl9hdXRoX3VzZXJfaGFzaCI6IjcyYzI3ZDNlNjIyOTNkNDc5MjcyNmI5MDRiZTI0YjQ0ZTkyOTNjN2RiNzhmNWEwNGU2MGUzNWVlNjJkM2I4MDkiLCJzZXNzaW9uX3V1aWQiOiI4MDExMTFmZSIsImlkIjo1Njc5NzkwLCJlbWFpbCI6InNhaWt1bWFyOTgxMjVAZ21haWwuY29tIiwidXNlcm5hbWUiOiJzYWlfa3VtYXI5ODEyNSIsInVzZXJfc2x1ZyI6InNhaV9rdW1hcjk4MTI1IiwiYXZhdGFyIjoiaHR0cHM6Ly9hc3NldHMubGVldGNvZGUuY29tL3VzZXJzL2RlZmF1bHRfYXZhdGFyLmpwZyIsInJlZnJlc2hlZF9hdCI6MTc3NjE2MzQ3MCwiaXAiOiIxODMuODIuMTA3LjcxIiwiaWRlbnRpdHkiOiJiODc1NDNlY2JjMGJhNjEwZDlmMDZmOWYyYzQzMmE0NiIsImRldmljZV93aXRoX2lwIjpbIjc3OGY3OWQwYzUwM2U4NDNlOTk2YzM1NmI5OGU4ZjAxIiwiMTgzLjgyLjEwNy43MSJdLCJfc2Vzc2lvbl9leHBpcnkiOjEyMDk2MDB9.BgtsBDI5qDHSPDOJpeGah9JI9IAhhuSCwfAiOAuY5Ts'
CSRF    = 'QsHPGLY0cvk54Hy6t1ZO14en6w88oJcs'

HEADERS = {
    'Content-Type': 'application/json',
    'Cookie': f'LEETCODE_SESSION={SESSION}; csrftoken={CSRF}',
    'x-csrftoken': CSRF,
    'Referer': 'https://leetcode.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Origin': 'https://leetcode.com',
}

GQL      = 'https://leetcode.com/graphql'
DATA_PATH = os.path.join(os.path.dirname(__file__), 'public', 'data', 'processed_data.json')

CONTENT_QUERY = """
query questionContent($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    content
    mysqlSchemas
  }
}
"""

def make_slug(title):
    import re
    slug = title.lower()
    slug = slug.replace('(', '').replace(')', '').replace(',', '').replace("'", '').replace('/', '-').replace('&', '')
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug.strip())
    slug = re.sub(r'-+', '-', slug)
    return slug

# Load data
print('Loading processed_data.json...')
with open(DATA_PATH, encoding='utf-8') as f:
    data = json.load(f)

problems = data['problems']
blank = [p for p in problems if not p.get('content') or p['content'].strip() == '']
print(f'Found {len(blank)} problems with blank content\n')

# Build index for fast lookup
id_to_idx = {p['id']: i for i, p in enumerate(problems)}

filled = 0
failed = 0
save_every = 20  # save progress every N problems

for i, p in enumerate(blank, 1):
    slug = make_slug(p['title'])

    resp = requests.post(GQL, json={
        'operationName': 'questionContent',
        'query': CONTENT_QUERY,
        'variables': {'titleSlug': slug}
    }, headers=HEADERS, timeout=15)

    content = None
    if resp.ok:
        q = resp.json().get('data', {}).get('question') or {}
        content = q.get('content')

    if content and content.strip():
        idx = id_to_idx[p['id']]
        problems[idx]['content'] = content
        filled += 1
        print(f'  [{i}/{len(blank)}] OK  [{p["id"]}] {p["title"]}')
    else:
        failed += 1
        print(f'  [{i}/{len(blank)}] FAIL [{p["id"]}] {p["title"]} (slug: {slug})')

    # Save progress periodically so we don't lose everything if interrupted
    if i % save_every == 0:
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
        print(f'  --- Progress saved ({filled} filled so far) ---')

    time.sleep(0.4)

# Final save
with open(DATA_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)

print(f'\nDone! Filled: {filled}, Failed: {failed}')
print('processed_data.json updated.')
