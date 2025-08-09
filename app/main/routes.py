from flask import render_template, request
from flask_login import current_user
from app.main import bp
from app.models import Post

@bp.route('/')
@bp.route('/index')
def index():
    """Home page showing recent published blog posts."""
    page = request.args.get('page', 1, type=int)
    posts = Post.query.filter_by(published=True).order_by(
        Post.created_at.desc()
    ).paginate(
        page=page, per_page=5, error_out=False
    )
    return render_template('index.html', title='Home', posts=posts)

@bp.route('/about')
def about():
    """About page."""
    return render_template('about.html', title='About')
