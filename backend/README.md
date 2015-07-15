Backend usage
=============

## Requirements
* Have postgreSQL 9.x installed locally
* Python 2.7.\* && virtualenv && pip installed 

## Process
1. Create a virtualenv

        $ virtualenv .venv

2. Activate the created virtualenv

        $ source .venv/bin/activate

3. Install dependencies

        $ pip install -r requirements.txt

4. Create an empty postgres DB for results storage

        $ createdb db_name

5. Create DATABASE_URL environment variable to connect to the DB created in the previous step or change the default value inside default_settings.py

6. Run the script to process and load the DB tables

        $ python scripts/process_results.py  

## Implementation notes

* We have used postgres as the DB because our final destination was the cartodb postgis DB and also because of the magic behind [postgres window functions](http://www.postgresql.org/docs/9.4/static/functions-window.html) that we have used to create the margin of victory of a party over the next one in a given polling station directly on SQL.
