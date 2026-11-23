#!/usr/bin/env python3
"""更新 data/catalog.json 的題數，並檢查題庫格式。

用法（在專案根目錄）：  python3 tools/build_catalog.py

- 每個單元一個檔：data/<科目id>/<冊別id>/<單元id>.json
- 資料夾裡有、catalog 沒列的單元，會自動加進去（名稱先用單元id，之後可手改）
- catalog 有列、但沒有檔案的單元，題數記為 0（網頁顯示「準備中」）
"""
import json, os, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
cat_path = os.path.join(ROOT, 'catalog.json')
cat = json.load(open(cat_path, encoding='utf-8'))
errors, total = [], 0

def check(q, where):
    for k in ('id', 'a'):
        if k not in q: errors.append(f'{where}: 缺少欄位 {k}')
    if 'o' in q and not (2 <= len(q['o']) <= 6):
        errors.append(f'{where} 題 {q.get("id")}: 選項數量異常')
    n = len(q['o']) if 'o' in q else q.get('n', 4)
    if isinstance(q.get('a'), int) and not (0 <= q['a'] < n):
        errors.append(f'{where} 題 {q.get("id")}: 答案超出選項範圍')
    if not q.get('s') and not q.get('img'):
        errors.append(f'{where} 題 {q.get("id")}: 沒有題目文字也沒有圖')

for s in cat['subjects']:
    for v in s['vols']:
        folder = os.path.join(ROOT, s['id'], v.get('dir', v['id']))
        files = sorted(f[:-5] for f in os.listdir(folder) if f.endswith('.json')) if os.path.isdir(folder) else []
        known = {u['id'] for u in v['units']}
        for f in files:
            if f not in known:
                v['units'].append({'id': f, 'name': f})
                print(f'＋ 新增單元 {s["name"]} {v["name"]} {f}')
        for u in v['units']:
            p = os.path.join(folder, u['id'] + '.json')
            if not os.path.exists(p):
                u['count'] = 0; continue
            qs = json.load(open(p, encoding='utf-8'))
            ids = set()
            for q in qs:
                check(q, f'{s["name"]}/{v["name"]}/{u["id"]}')
                if q.get('id') in ids: errors.append(f'{u["id"]}: 題號重複 {q["id"]}')
                ids.add(q.get('id'))
                if q.get('img') and not os.path.exists(os.path.join(folder, q['img'])):
                    errors.append(f'{u["id"]} 題 {q["id"]}: 找不到圖片 {q["img"]}')
            u['count'] = len(qs); total += len(qs)

json.dump(cat, open(cat_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'完成：共 {total} 題')
if errors:
    print('\n'.join(['⚠ 發現問題：'] + errors[:50])); sys.exit(1)
