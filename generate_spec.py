import json
from backend.app import app, api

def generate_spec():
    """Generates the OpenAPI spec, setting SERVER_NAME for context."""
    # Configure SERVER_NAME for url_for to work correctly outside of a request
    app.config['SERVER_NAME'] = 'localhost:5000'
    
    with app.app_context():
        # The schema can now be accessed successfully within the context
        spec = api.__schema__
    
    with open('openapi.json', 'w', encoding='utf-8') as f:
        json.dump(spec, f, ensure_ascii=False, indent=2)
    
    print("Successfully generated openapi.json")

if __name__ == '__main__':
    generate_spec()
