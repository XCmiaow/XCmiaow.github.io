"""
Deploy GitHub Profile README to XCmiaow/XCmiaow
"""
import base64, json, os, requests

TOKEN = os.environ.get('GH_TOKEN') or input('GitHub token: ')
USER = 'XCmiaow'
REPO = 'XCmiaow'
H = {'Authorization': f'token {TOKEN}', 'Accept': 'application/vnd.github.v3+json'}
API = 'https://api.github.com'

# Read README content
readme_path = os.path.join(os.path.dirname(__file__), '..', 'github-profile-README.md')
with open(readme_path, 'r', encoding='utf-8') as f:
    content = f.read()
encoded = base64.b64encode(content.encode('utf-8')).decode('ascii')

# Try to get existing file SHA first (for update)
sha = None
r = requests.get(f'{API}/repos/{USER}/{REPO}/contents/README.md', headers=H)
if r.status_code == 200:
    sha = r.json().get('sha')
    print('[1/2] Existing README found, will update')
elif r.status_code == 404:
    print('[1/2] No existing README, will create')
else:
    print(f'[1/2] Repo may not exist, creating...')
    requests.post(f'{API}/user/repos', headers=H, json={
        'name': REPO, 'auto_init': False, 'private': False
    })

# Create or update README
body = {'message': 'Initial profile README', 'content': encoded, 'branch': 'main'}
if sha:
    body['sha'] = sha

r = requests.put(f'{API}/repos/{USER}/{REPO}/contents/README.md', headers=H, json=body)
if r.status_code in (200, 201):
    print('[2/2] README deployed successfully!')
    print(f'👉 https://github.com/{USER}')
else:
    print(f'Error: {r.json().get("message", r.text)}')
