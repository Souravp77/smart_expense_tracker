from app.core.extensions import bcrypt, login_manager


def register_extensions(app):
    login_manager.init_app(app)
    bcrypt.init_app(app)


def register_blueprints(app):
    from app.routes.api import api_bp
    from app.routes.auth import auth_bp
    from app.routes.main import main_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
