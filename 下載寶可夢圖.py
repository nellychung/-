#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
寵物王國：下載「異色版」與「限定版」寶可夢圖片

用法（在專案資料夾裡執行，也就是 index.html 和 pk 資料夾所在的地方）：

  python 下載寶可夢圖.py                 → 為 pk 資料夾裡所有寶可夢，下載異色圖到 pk/shiny/
  python 下載寶可夢圖.py 6 25 150        → 只下載這幾個圖鑑編號的異色圖
  python 下載寶可夢圖.py --新增 884 1000 → 下載「一般圖＋異色圖」（用來新增 pk 裡還沒有的限定寶可夢）
  加上 --重新下載                        → 已經有的檔案也重抓

圖片來源：PokeAPI 社群整理的寶可夢圖庫（GitHub: PokeAPI/sprites）。
說明：寶可夢官網（pokemon.com／寶可夢圖鑑）只提供一般圖，沒有異色圖，所以異色圖要從這個圖庫下載。
圖片的著作權屬於 Nintendo / Creatures / GAME FREAK / The Pokémon Company，請只在班級教學內使用。
"""
import io
import os
import re
import sys
import time
import urllib.error
import urllib.request

BASE = os.environ.get('PK_SPRITE_BASE', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon')
PATHS = {
    'normal': ['other/official-artwork/{n}.png', 'other/home/{n}.png', '{n}.png'],
    'shiny': ['other/official-artwork/shiny/{n}.png', 'other/home/shiny/{n}.png', 'shiny/{n}.png'],
}
SIZE = 192  # 和 pk 裡現有的圖一樣大小

try:
    from PIL import Image  # 有安裝 Pillow 才會自動縮成 192x192
except Exception:
    Image = None


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'pet-kingdom-downloader'})
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(1)
        except Exception:
            time.sleep(1)
    return None


def shrink(data):
    if Image is None:
        return data
    im = Image.open(io.BytesIO(data)).convert('RGBA')
    im.thumbnail((SIZE, SIZE))
    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2), im)
    out = io.BytesIO()
    canvas.save(out, 'PNG', optimize=True)
    return out.getvalue()


def get_one(kind, n, dest, force):
    if os.path.exists(dest) and not force:
        return 'skip'
    for p in PATHS[kind]:
        data = fetch(BASE + '/' + p.format(n=n))
        if data:
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, 'wb') as f:
                f.write(shrink(data))
            return 'ok'
    return 'miss'


def main(argv):
    force = '--重新下載' in argv or '--force' in argv
    add = '--新增' in argv or '--add' in argv
    nums = [a for a in argv if re.fullmatch(r'\d+', a)]
    here = os.path.dirname(os.path.abspath(__file__))
    pk = os.path.join(here, 'pk')
    if not os.path.isdir(pk):
        print('找不到 pk 資料夾。請把這個檔案放在 index.html 旁邊再執行。')
        return 1
    if not nums:
        if add:
            print('請在 --新增 後面接圖鑑編號，例如：python 下載寶可夢圖.py --新增 884')
            return 1
        nums = sorted({m.group(1) for f in os.listdir(pk) for m in [re.fullmatch(r'(\d+)\.png', f)] if m}, key=int)
    if Image is None:
        print('（提示：沒有安裝 Pillow，圖片會用原始大小存檔，網頁照樣能用。想自動縮小可先執行：pip install pillow）')
    res = {'ok': 0, 'skip': 0, 'miss': []}
    for n in nums:
        kinds = [('normal', os.path.join(pk, n + '.png')), ('shiny', os.path.join(pk, 'shiny', n + '.png'))] if add else [('shiny', os.path.join(pk, 'shiny', n + '.png'))]
        for kind, dest in kinds:
            r = get_one(kind, n, dest, force)
            if r == 'ok':
                res['ok'] += 1
                print('已下載', ('一般' if kind == 'normal' else '異色'), n)
            elif r == 'skip':
                res['skip'] += 1
            else:
                res['miss'].append(('一般' if kind == 'normal' else '異色') + n)
    print('\n完成：新下載 %d 張，已經有而略過 %d 張。' % (res['ok'], res['skip']))
    if res['miss']:
        print('找不到這些圖（可能圖庫沒有）：', '、'.join(res['miss']))
    print('下載的異色圖在 pk/shiny/ 裡。把整個專案（含 pk 資料夾）重新上傳到網站，網頁就會自動使用。')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
