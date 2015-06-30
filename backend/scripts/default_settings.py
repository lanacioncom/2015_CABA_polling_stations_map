import os

DEBUG = os.environ.get('DEBUG', False)
DB_RESULTS_URL = os.environ.get('DB_RESULTS_URL', 'postgresql://username@localhost:5432/results')
DB_DISTRICTS_URL = os.environ.get('DB_DISTRICTS_URL', 'postgresql://username@localhost:5432/districts')