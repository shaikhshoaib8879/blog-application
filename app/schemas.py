from marshmallow import Schema, fields

class UserSchema(Schema):
    """User serialization schema."""
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True)
    firstName = fields.Str(required=False, allow_none=True)
    lastName = fields.Str(required=False, allow_none=True)
    email = fields.Email(required=True)
    created_at = fields.DateTime(dump_only=True)
    is_active = fields.Bool(dump_only=True)

class PostSchema(Schema):
    """Post serialization schema."""
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    content = fields.Str(required=True)
    published = fields.Bool(load_default=False)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    author = fields.Nested(UserSchema, exclude=['email'], dump_only=True)

class LoginSchema(Schema):
    """Login request schema."""
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class RegisterSchema(Schema):
    """Registration request schema."""
    username = fields.Str(required=True)
    firstName = fields.Str(required=False, allow_none=True)
    lastName = fields.Str(required=False, allow_none=True)
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class TokenSchema(Schema):
    """Token response schema."""
    access_token = fields.Str()
    user = fields.Nested(UserSchema, exclude=['email'])
