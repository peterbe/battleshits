"""
Django settings for headsupper project.

For more information on this file, see
https://docs.djangoproject.com/en/1.7/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.7/ref/settings/
"""

import os

import dj_database_url
from decouple import Csv, config


# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.7/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config("DEBUG", cast=bool)
DEBUG_PROPAGATE_EXCEPTIONS = config("DEBUG_PROPAGATE_EXCEPTIONS", False, cast=bool)

ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=Csv())


# Application definition

INSTALLED_APPS = [
    # Project specific apps
    "battleshits.base",
    "battleshits.api",
    # Django apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.sites",
    # Third-party
    "corsheaders",
]

for app in config("EXTRA_APPS", default="", cast=Csv()):
    INSTALLED_APPS.append(app)


MIDDLEWARE_CLASSES = (
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "battleshits.api.middleware.JsonBodyCsrfViewMiddleware",
    # 'django.middleware.csrf.CsrfViewMiddleware',
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.auth.middleware.SessionAuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'csp.middleware.CSPMiddleware',
)

ROOT_URLCONF = "battleshits.urls"

WSGI_APPLICATION = "battleshits.wsgi.application"


# Database
DATABASES = {"default": config("DATABASE_URL", cast=dj_database_url.parse)}

# Internationalization

LANGUAGE_CODE = config("LANGUAGE_CODE", default="en-us")

TIME_ZONE = config("TIME_ZONE", default="UTC")

USE_I18N = config("USE_I18N", default=False, cast=bool)

USE_L10N = config("USE_L10N", default=True, cast=bool)

USE_TZ = config("USE_TZ", default=True, cast=bool)

STATIC_ROOT = config("STATIC_ROOT", default=os.path.join(BASE_DIR, "static"))
STATIC_URL = config("STATIC_URL", "/static/")


SESSION_COOKIE_SECURE = config("SESSION_COOKIE_SECURE", default=not DEBUG, cast=bool)


# TEMPLATES = [
#     {
#         'BACKEND': 'django_jinja.backend.Jinja2',
#         'APP_DIRS': True,
#         'OPTIONS': {
#             'match_extension': '.jinja',
#             'newstyle_gettext': True,
#             'context_processors': [
#                 # 'battleshits.base.context_processors.settings',
#                 # 'django.template.context_processors.request',
#             ],
#         }
#     },
#     {
#         'BACKEND': 'django.template.backends.django.DjangoTemplates',
#         'APP_DIRS': True,
#         'OPTIONS': {
#             'context_processors': [
#                 'django.contrib.auth.context_processors.auth',
#                 'django.template.context_processors.request',
#                 'django.template.context_processors.debug',
#                 'django.template.context_processors.i18n',
#                 'django.template.context_processors.media',
#                 'django.template.context_processors.static',
#                 'django.template.context_processors.tz',
#             ],
#         }
#     },
# ]

# Django-CSP
CSP_DEFAULT_SRC = (
    "'self'",
    "'unsafe-inline'",
)
CSP_FONT_SRC = (
    "'self'",
    "http://fonts.googleapis.com",
    "https://fonts.googleapis.com",
    "http://fonts.gstatic.com",
    "https://fonts.gstatic.com",
)
CSP_STYLE_SRC = (
    "'self'",
    "'unsafe-inline'",
    "http://fonts.googleapis.com",
    "https://fonts.googleapis.com",
)

EMAIL_BACKEND = config(
    "EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend"
)
EMAIL_HOST = config("EMAIL_HOST", default="localhost")
EMAIL_PORT = config("EMAIL_PORT", default=25, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", False, cast=bool)


SITE_ID = 1


LOGIN_REDIRECT_URL = "/"


FANOUT_REALM_ID = config("FANOUT_REALM_ID", default="")
FANOUT_REALM_KEY = config("FANOUT_REALM_KEY", default="")


SERVER_EMAIL = config("SERVER_EMAIL", default="root@localhost")


# E.g. `Peter, mail@example.com; John, foo@bar.com`
ADMINS = tuple(
    [
        tuple([e.strip() for e in x.strip().split(",")])
        for x in config("ADMINS", default="").split(";")
        if x.strip()
    ]
)

CORS_ALLOW_CREDENTIALS = config("CORS_ALLOW_CREDENTIALS", False, cast=bool)
CORS_ORIGIN_ALLOW_ALL = config("CORS_ORIGIN_ALLOW_ALL", False, cast=bool)
CORS_URLS_REGEX = config("CORS_URLS_REGEX", r"^/api/.*$")
CORS_ORIGIN_WHITELIST = config("CORS_ORIGIN_WHITELIST", default="", cast=Csv())

SESSION_COOKIE_AGE = config("SESSION_COOKIE_AGE", default=60 * 60 * 24 * 365, cast=int)
