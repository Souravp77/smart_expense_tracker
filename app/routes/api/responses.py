from flask import jsonify


def ok(payload):
    return jsonify(payload), 200


def created(payload):
    return jsonify(payload), 201


def bad_request(error):
    return jsonify({'error': str(error)}), 400


def server_error(error):
    return jsonify({'error': str(error)}), 500
