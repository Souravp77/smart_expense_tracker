import secrets

from flask import current_app, jsonify, request, session


def get_csrf_token():
    token = session.get('_csrf_token')
    if not token:
        token = secrets.token_urlsafe(32)
        session['_csrf_token'] = token
    return token


def register_csrf(app):
    @app.context_processor
    def inject_csrf_token():
        return {'csrf_token': get_csrf_token()}

    @app.before_request
    def protect_api_mutations():
        if current_app.testing:
            return None

        if request.method not in {'POST', 'PUT', 'PATCH', 'DELETE'}:
            return None

        if request.blueprint not in {'api', 'auth'}:
            return None

        expected = session.get('_csrf_token')
        provided = request.headers.get('X-CSRF-Token') or request.form.get('_csrf_token')

        if not expected or not provided or not secrets.compare_digest(expected, provided):
            current_app.logger.warning('CSRF validation failed for %s', request.path)
            return jsonify({'error': 'CSRF validation failed'}), 403

        return None
