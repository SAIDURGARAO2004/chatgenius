import os
from dotenv import load_dotenv
from google import genai

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

key = os.getenv('GEMINI_API_KEY')
print('GEMINI_API_KEY present:', bool(key))

if not key:
    print('No key found in .env')
else:
    try:
        # Try calling list_models directly (some genai versions expose this)
        models = genai.list_models()
        print('Model count:', len(models))
        for m in models[:10]:
            print('-', getattr(m, 'name', str(m)))
    except Exception as e:
        print('Gemini test failed (list_models):', e)
        try:
            # Try constructing a client and listing via attribute access
            client = genai.Client(api_key=key)
            # attempt to access client.models if available
            models = getattr(client, 'models', None)
            if models is None:
                print('Client has no models attribute; cannot list models via this SDK')
            else:
                try:
                    lm = client.list_models()
                    print('Client list_models count:', len(lm))
                except Exception as e2:
                    print('Client list_models failed:', e2)
        except Exception as e3:
            print('Gemini client construction failed:', e3)
    print('\n--- genai module attributes ---')
    try:
        import inspect
        print(', '.join(sorted([a for a in dir(genai) if not a.startswith('_')])[:200]))
        print('\n--- genai.Client attributes ---')
        try:
            client = genai.Client(api_key=key)
            print(', '.join(sorted([a for a in dir(client) if not a.startswith('_')])[:200]))
            print('\n--- client.models attributes ---')
            try:
                print(', '.join(sorted([a for a in dir(client.models) if not a.startswith('_')])[:200]))
                # Try listing models via client.models.list()
                try:
                    lm = client.models.list()
                    print('\nListed models count via client.models.list():', len(lm))
                    for m in lm[:10]:
                        print(' *', getattr(m, 'name', str(m)))
                except Exception as e7:
                    print('client.models.list() failed:', e7)

                # Try a small generation test if a typical model is available
                try:
                    test_model = 'models/gemini-2.5-flash'
                    print('\nAttempting generate_content with model', test_model)
                    resp = client.models.generate_content(model=test_model, contents='Hello from test')
                    print('generate_content returned type', type(resp))
                    # try to extract text
                    txt = getattr(resp, 'text', None) or (resp.get('text') if isinstance(resp, dict) else None)
                    print('Generated text:', txt)
                except Exception as e8:
                    print('generate_content failed:', e8)
            except Exception as e6:
                print('Could not list client.models attrs:', e6)
        except Exception as e4:
            print('Could not construct client for introspection:', e4)
    except Exception as e5:
        print('Introspection failed:', e5)
