from flask import current_app, jsonify


def ok(payload):
    return jsonify(payload), 200


def created(payload):
    return jsonify(payload), 201


def bad_request(error):
    return jsonify({'error': str(error)}), 400


def not_found(message='Resource not found'):
    return jsonify({'error': str(message)}), 404


def server_error(error=None):
    if error is not None:
        current_app.logger.exception('Unhandled API error: %s', error)
    return jsonify({'error': 'Internal server error'}), 500
