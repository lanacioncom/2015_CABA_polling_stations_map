import os

DEBUG = os.environ.get('DEBUG', False)
DB_RESULTS_URL = os.environ.get('DB_RESULTS_URL', 'postgresql://username@localhost:5432/results')