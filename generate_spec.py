import yaml
from backend.app import app, api

def generate_spec():
    """Generates the OpenAPI spec as a YAML file."""
    # Configure SERVER_NAME for url_for to work correctly outside of a request
    app.config['SERVER_NAME'] = 'localhost:5000'
    
    with app.app_context():
        # The schema can now be accessed successfully within the context
        spec = api.__schema__
    
    with open('swagger.yaml', 'w', encoding='utf-8') as f:
        yaml.dump(spec, f, allow_unicode=True, sort_keys=False, indent=2)
    
    print("Successfully generated swagger.yaml")

if __name__ == '__main__':
    generate_spec()
