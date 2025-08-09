from datetime import datetime
from flask import render_template, redirect, url_for, flash, request, abort
from flask_login import login_required, current_user

from app import db
from app.blog import bp
from app.blog.forms import PostForm
from app.models import Post

@bp.route('/posts')
def posts():
    """List all published posts."""
    page = request.args.get('page', 1, type=int)
    posts = Post.query.filter_by(published=True).order_by(
        Post.created_at.desc()
    ).paginate(
        page=page, per_page=10, error_out=False
    )
    return render_template('blog/posts.html', title='Blog Posts', posts=posts)

@bp.route('/post/<int:id>')
def post(id):
    """View a single blog post."""
    post = Post.query.get_or_404(id)
    if not post.published and (not current_user.is_authenticated or post.author != current_user):
        abort(404)
    return render_template('blog/post.html', title=post.title, post=post)

@bp.route('/create', methods=['GET', 'POST'])
@login_required
def create_post():
    """Create a new blog post."""
    form = PostForm()
    if form.validate_on_submit():
        post = Post(
            title=form.title.data,
            content=form.content.data,
            published=form.published.data,
            author=current_user
        )
        db.session.add(post)
        db.session.commit()
        flash('Your post has been created!', 'success')
        return redirect(url_for('blog.post', id=post.id))
    
    return render_template('blog/create_post.html', title='Create Post', form=form)

@bp.route('/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_post(id):
    """Edit an existing blog post."""
    post = Post.query.get_or_404(id)
    if post.author != current_user:
        abort(403)
    
    form = PostForm()
    if form.validate_on_submit():
        post.title = form.title.data
        post.content = form.content.data
        post.published = form.published.data
        post.updated_at = datetime.utcnow()
        db.session.commit()
        flash('Your post has been updated!', 'success')
        return redirect(url_for('blog.post', id=post.id))
    elif request.method == 'GET':
        form.title.data = post.title
        form.content.data = post.content
        form.published.data = post.published
    
    return render_template('blog/edit_post.html', title='Edit Post', form=form, post=post)

@bp.route('/delete/<int:id>', methods=['POST'])
@login_required
def delete_post(id):
    """Delete a blog post."""
    post = Post.query.get_or_404(id)
    if post.author != current_user:
        abort(403)
    
    db.session.delete(post)
    db.session.commit()
    flash('Your post has been deleted!', 'success')
    return redirect(url_for('blog.my_posts'))

@bp.route('/my-posts')
@login_required
def my_posts():
    """List current user's posts."""
    page = request.args.get('page', 1, type=int)
    posts = Post.query.filter_by(author=current_user).order_by(
        Post.created_at.desc()
    ).paginate(
        page=page, per_page=10, error_out=False
    )
    return render_template('blog/my_posts.html', title='My Posts', posts=posts)
