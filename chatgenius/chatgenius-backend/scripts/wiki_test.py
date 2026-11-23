import requests
q='What is cricket in one sentence'
search_url='https://en.wikipedia.org/w/api.php'
params={'action':'query','list':'search','srsearch':q,'format':'json','srlimit':1}
r=requests.get(search_url,params=params,timeout=6)
print('status',r.status_code)
print(r.json())
if r.status_code==200:
    hits=r.json().get('query',{}).get('search',[])
    if hits:
        title=hits[0]['title']
        print('title',title)
        summary_url=f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(title)}"
        r2=requests.get(summary_url,timeout=6)
        print('summary status',r2.status_code)
        print(r2.text)
